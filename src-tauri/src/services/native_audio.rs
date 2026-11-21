//! Audio-only libmpv fallback for formats WebView2 cannot decode.
//! All libmpv calls stay on one worker thread; the UI sends it the video clock.

use std::ffi::{c_char, c_void, CStr, CString};
use std::path::PathBuf;
use std::sync::{mpsc, Arc, Mutex};
use std::time::Duration;

use libloading::Library;
use serde::Serialize;

use crate::data::models::eq_state::EqState;
use crate::services::audio_filter_builder::build_audio_filter;

type Handle = *mut c_void;

#[derive(Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NativeAudioStatus {
    pub ready: bool,
    pub codec: Option<String>,
    pub position: Option<f64>,
    pub error: Option<String>,
}

#[derive(Clone)]
pub struct AudioSync {
    pub path: String,
    pub position: f64,
    pub playing: bool,
    pub volume: f64,
    pub eq: EqState,
    pub speed: f64,
    pub seeking: bool,
}

enum Message {
    Sync(AudioSync),
    Stop(String),
}

pub struct NativeAudioBridge {
    sender: Option<mpsc::Sender<Message>>,
    status: Arc<Mutex<NativeAudioStatus>>,
}

impl NativeAudioBridge {
    pub fn new(library_path: PathBuf) -> Self {
        let status = Arc::new(Mutex::new(NativeAudioStatus::default()));
        if !library_path.is_file() {
            status.lock().unwrap().error = Some("Native audio decoder is missing".into());
            return Self { sender: None, status };
        }
        let (sender, receiver) = mpsc::channel();
        let worker_status = Arc::clone(&status);
        std::thread::spawn(move || {
            if let Err(error) = run_worker(library_path, receiver, &worker_status) {
                worker_status.lock().unwrap().error = Some(error);
            }
        });
        Self { sender: Some(sender), status }
    }

    pub fn sync(&self, update: AudioSync) -> Result<NativeAudioStatus, String> {
        self.sender.as_ref().ok_or("Native audio decoder is missing")?
            .send(Message::Sync(update)).map_err(|_| "Native audio decoder stopped")?;
        Ok(self.status.lock().unwrap().clone())
    }

    pub fn stop(&self, path: String) {
        if let Some(sender) = &self.sender {
            let _ = sender.send(Message::Stop(path));
        }
    }
}

struct Mpv {
    _library: Library,
    handle: Handle,
    command_fn: unsafe extern "C" fn(Handle, *const *const c_char) -> i32,
    set_fn: unsafe extern "C" fn(Handle, *const c_char, *const c_char) -> i32,
    get_fn: unsafe extern "C" fn(Handle, *const c_char) -> *mut c_char,
    free_fn: unsafe extern "C" fn(*mut c_void),
    destroy_fn: unsafe extern "C" fn(Handle),
}

impl Mpv {
    fn new(path: &PathBuf) -> Result<Self, String> {
        unsafe {
            let library = Library::new(path).map_err(|error| error.to_string())?;
            let create: unsafe extern "C" fn() -> Handle = *library.get(b"mpv_create\0").map_err(|e| e.to_string())?;
            let initialize: unsafe extern "C" fn(Handle) -> i32 = *library.get(b"mpv_initialize\0").map_err(|e| e.to_string())?;
            let option: unsafe extern "C" fn(Handle, *const c_char, *const c_char) -> i32 = *library.get(b"mpv_set_option_string\0").map_err(|e| e.to_string())?;
            let command_fn = *library.get(b"mpv_command\0").map_err(|e| e.to_string())?;
            let set_fn = *library.get(b"mpv_set_property_string\0").map_err(|e| e.to_string())?;
            let get_fn = *library.get(b"mpv_get_property_string\0").map_err(|e| e.to_string())?;
            let free_fn = *library.get(b"mpv_free\0").map_err(|e| e.to_string())?;
            let destroy_fn: unsafe extern "C" fn(Handle) = *library.get(b"mpv_terminate_destroy\0").map_err(|e| e.to_string())?;
            let handle = create();
            if handle.is_null() { return Err("Could not create native audio decoder".into()); }
            for (name, value) in [("vid", "no"), ("pause", "yes"), ("keep-open", "yes"), ("audio-display", "no"), ("sid", "no")] {
                let name = CString::new(name).unwrap();
                let value = CString::new(value).unwrap();
                if option(handle, name.as_ptr(), value.as_ptr()) < 0 {
                    destroy_fn(handle);
                    return Err("Could not configure native audio decoder".into());
                }
            }
            if initialize(handle) < 0 {
                destroy_fn(handle);
                return Err("Could not initialize native audio decoder".into());
            }
            Ok(Self { _library: library, handle, command_fn, set_fn, get_fn, free_fn, destroy_fn })
        }
    }

    fn command(&self, args: &[&str]) -> Result<(), String> {
        let strings = args.iter().map(|arg| CString::new(*arg).map_err(|e| e.to_string()))
            .collect::<Result<Vec<_>, _>>()?;
        let mut pointers = strings.iter().map(|arg| arg.as_ptr()).collect::<Vec<_>>();
        pointers.push(std::ptr::null());
        let result = unsafe { (self.command_fn)(self.handle, pointers.as_ptr()) };
        if result < 0 { Err(format!("Native audio command failed ({result})")) } else { Ok(()) }
    }

    fn set(&self, name: &str, value: &str) -> Result<(), String> {
        let name = CString::new(name).map_err(|e| e.to_string())?;
        let value = CString::new(value).map_err(|e| e.to_string())?;
        let result = unsafe { (self.set_fn)(self.handle, name.as_ptr(), value.as_ptr()) };
        if result < 0 { Err(format!("Native audio setting failed ({result})")) } else { Ok(()) }
    }

    fn get(&self, name: &str) -> Option<String> {
        let name = CString::new(name).ok()?;
        let pointer = unsafe { (self.get_fn)(self.handle, name.as_ptr()) };
        if pointer.is_null() { return None; }
        let value = unsafe { CStr::from_ptr(pointer).to_string_lossy().into_owned() };
        unsafe { (self.free_fn)(pointer.cast()) };
        Some(value)
    }
}

impl Drop for Mpv {
    fn drop(&mut self) { unsafe { (self.destroy_fn)(self.handle) } }
}

fn run_worker(path: PathBuf, receiver: mpsc::Receiver<Message>, status: &Arc<Mutex<NativeAudioStatus>>) -> Result<(), String> {
    let mpv = Mpv::new(&path)?;
    let mut current_path: Option<String> = None;
    let mut latest: Option<AudioSync> = None;
    let mut pending_seek = false;
    let mut last_filter = String::new();
    let mut last_delay = 0.0;
    let mut last_volume = -1.0;
    let mut last_speed = 1.0;
    let mut last_paused: Option<bool> = None;

    loop {
        // Only poll while a newly loaded file is getting ready. Reapplying a
        // stale clock between updates can seek backwards during fast playback.
        let message = if pending_seek && latest.as_ref().is_some_and(|clock| !clock.seeking) {
            match receiver.recv_timeout(Duration::from_millis(180)) {
                Ok(message) => Some(message),
                Err(mpsc::RecvTimeoutError::Disconnected) => break,
                Err(mpsc::RecvTimeoutError::Timeout) => None,
            }
        } else {
            match receiver.recv() {
                Ok(message) => Some(message),
                Err(_) => break,
            }
        };
        // Drop superseded clock updates before touching the decoder.
        for message in message.into_iter().chain(receiver.try_iter()) {
            match message {
                Message::Sync(update) => latest = Some(update),
                Message::Stop(path) => {
                    if latest.as_ref().is_some_and(|clock| clock.path == path) { latest = None; }
                    if current_path.as_deref() == Some(&path) {
                        mpv.command(&["stop"])?;
                        current_path = None;
                        pending_seek = false;
                        *status.lock().unwrap() = NativeAudioStatus::default();
                    }
                }
            }
        }
        let Some(update) = latest.as_ref() else { continue };
        if current_path.as_deref() != Some(&update.path) {
            mpv.set("pause", "yes")?;
            mpv.command(&["loadfile", &update.path, "replace"])?;
            current_path = Some(update.path.clone());
            pending_seek = true;
            last_paused = Some(true);
            status.lock().unwrap().ready = false;
        }
        if (last_volume - update.volume).abs() > 0.01 {
            mpv.set("volume", &update.volume.clamp(0.0, 150.0).to_string())?;
            last_volume = update.volume;
        }
        let speed = update.speed.clamp(0.1, 16.0);
        if (last_speed - speed).abs() > 0.001 {
            mpv.set("speed", &speed.to_string())?;
            last_speed = speed;
        }
        let filter = build_audio_filter(&update.eq);
        if filter != last_filter {
            mpv.set("af", &filter)?;
            last_filter = filter;
        }
        if (last_delay - update.eq.audio_delay_sec).abs() > 0.001 {
            mpv.set("audio-delay", &update.eq.audio_delay_sec.to_string())?;
            last_delay = update.eq.audio_delay_sec;
        }
        let codec = mpv.get("audio-codec-name");
        let position = mpv.get("time-pos").and_then(|value| value.parse::<f64>().ok());
        let ready = codec.is_some() && position.is_some() &&
            mpv.get("path").as_deref() == Some(update.path.as_str());
        if ready {
            let target = update.position.max(0.0);
            if update.seeking {
                pending_seek = true;
            } else if pending_seek || position.is_some_and(|actual| (actual - target).abs() > 0.35) {
                mpv.command(&["seek", &target.to_string(), "absolute+exact"])?;
                pending_seek = false;
            }
            let pause = !update.playing || update.seeking;
            if last_paused != Some(pause) {
                mpv.set("pause", if pause { "yes" } else { "no" })?;
                last_paused = Some(pause);
            }
        }
        let mut observed = status.lock().unwrap();
        observed.ready = ready;
        observed.codec = codec;
        observed.position = position;
        observed.error = None;
    }
    Ok(())
}
