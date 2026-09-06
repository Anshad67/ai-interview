import React, { useState, useEffect, useRef } from 'react';
import { Video, VideoOff, Mic, MicOff, User } from 'lucide-react';

const WebcamView = ({ candidateName = 'Candidate', isListening = false }) => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(true);
  const [hasPermission, setHasPermission] = useState(true);

  useEffect(() => {
    let currentStream = null;

    const startCamera = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const s = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 } },
            audio: false // audio handled separately by Web Speech API
          });
          currentStream = s;
          setStream(s);
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
          setHasPermission(true);
        }
      } catch (err) {
        console.warn('Webcam not available or permission denied:', err);
        setHasPermission(false);
        setCameraActive(false);
      }
    };

    if (cameraActive) {
      startCamera();
    }

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraActive]);

  const toggleCamera = () => {
    if (cameraActive && stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setCameraActive(false);
    } else {
      setCameraActive(true);
    }
  };

  return (
    <div className="relative w-full aspect-video rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden flex items-center justify-center">
      
      {/* Live Video Stream */}
      {cameraActive && hasPermission ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover transform -scale-x-100"
        />
      ) : (
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
            <User className="w-10 h-10" />
          </div>
          <p className="text-sm font-semibold text-slate-300">{candidateName}</p>
          <p className="text-xs text-slate-500 mt-0.5">Camera is turned off</p>
        </div>
      )}

      {/* Top Status Overlays */}
      <div className="absolute top-3 left-3 flex items-center gap-2">
        <div className="px-2.5 py-1 rounded-md bg-slate-950/70 backdrop-blur-md border border-slate-800 text-[11px] font-semibold text-white flex items-center gap-1.5 shadow">
          <span className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
          {candidateName}
        </div>

        {isListening && (
          <div className="px-2.5 py-1 rounded-md bg-red-500/20 backdrop-blur-md border border-red-500/40 text-[11px] font-semibold text-red-400 flex items-center gap-1.5 animate-pulse shadow">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            REC
          </div>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <div className="absolute bottom-3 right-3 flex items-center gap-2">
        <button
          type="button"
          onClick={toggleCamera}
          className={`p-2 rounded-lg backdrop-blur-md transition-colors text-xs ${
            cameraActive
              ? 'bg-slate-900/80 text-slate-200 hover:bg-slate-800'
              : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
          }`}
          title={cameraActive ? 'Turn off camera' : 'Turn on camera'}
        >
          {cameraActive ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
        </button>
      </div>

    </div>
  );
};

export default WebcamView;
