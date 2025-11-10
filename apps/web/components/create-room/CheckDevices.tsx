"use client";

import React, { useEffect, useRef, useState } from "react";

const CheckDevices = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const micStreamRef = useRef<MediaStream | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedCam, setSelectedCam] = useState<string>("");
    const [selectedMic, setSelectedMic] = useState<string>("");
    const [selectedSpeaker, setSelectedSpeaker] = useState<string>("");
    const [micLevel, setMicLevel] = useState<number>(0);
    const [error, setError] = useState<string>("");

    // Get list of devices
    const getDevices = async () => {
        try {
            // Request permissions first to get device labels
            await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            const devices = await navigator.mediaDevices.enumerateDevices();
            setDevices(devices);
            setError("");
        } catch (err) {
            setError("Failed to get devices. Please allow camera and microphone access.");
            console.error("Error getting devices:", err);
        }
    };

    // Setup video preview
    const setupCamera = async (deviceId: string) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: { exact: deviceId } },
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setError("");
        } catch (err) {
            setError("Failed to access camera");
            console.error("Camera error:", err);
        }
    };

    // Cleanup audio resources
    const cleanupAudio = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        if (micStreamRef.current) {
            micStreamRef.current.getTracks().forEach((track) => track.stop());
            micStreamRef.current = null;
        }

        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        analyserRef.current = null;
        setMicLevel(0);
    };

    // Setup microphone analyzer
    const setupMic = async (deviceId: string) => {
        try {
            // Cleanup previous audio setup
            cleanupAudio();

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { deviceId: { exact: deviceId } },
            });

            micStreamRef.current = stream;

            // Create new audio context
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = audioCtx;

            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();

            // Configure analyser for better volume detection
            analyser.fftSize = 512;
            analyser.smoothingTimeConstant = 0.8;

            source.connect(analyser);
            analyserRef.current = analyser;

            // Use time domain data for volume level
            const dataArray = new Uint8Array(analyser.fftSize);

            const updateLevel = () => {
                if (!analyserRef.current || !audioContextRef.current) return;

                // Get time domain data (waveform)
                analyserRef.current.getByteTimeDomainData(dataArray);

                console.log(dataArray.slice(0, 10));

                // Calculate RMS (Root Mean Square) for volume level
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                    //@ts-ignore
                    const amplitude = (dataArray[i] - 128) / 128; // Normalize to -1 to 1
                    sum += amplitude * amplitude;
                }
                const rms = Math.sqrt(sum / dataArray.length);

                // Convert to percentage and smooth the value
                const level = Math.min(rms * 190, 100); // Scale and cap at 100%
                setMicLevel(level);

                animationFrameRef.current = requestAnimationFrame(updateLevel);
            };

            updateLevel();
            setError("");

        } catch (err) {
            setError("Failed to access microphone");
            console.error("Microphone error:", err);
        }
    };

    // Play test sound to selected speaker
    const playTestSound = async () => {
        try {
            if (audioRef.current) {
                // Create a simple beep sound using Web Audio API since we don't have a test file
                const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);

                oscillator.frequency.value = 440; // A4 note
                oscillator.type = 'sine';

                gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);

                oscillator.start(audioCtx.currentTime);
                oscillator.stop(audioCtx.currentTime + 1);

                // Set speaker output if supported
                if (selectedSpeaker && "setSinkId" in audioRef.current) {
                    try {
                        await audioRef.current.setSinkId(selectedSpeaker);
                    } catch (err) {
                        console.error("Error setting speaker:", err);
                    }
                }
            }
        } catch (err) {
            setError("Failed to play test sound");
            console.error("Speaker test error:", err);
        }
    };

    // Initial fetch of devices
    useEffect(() => {
        getDevices();
        navigator.mediaDevices.addEventListener("devicechange", getDevices);
        return () => {
            navigator.mediaDevices.removeEventListener("devicechange", getDevices);
            cleanupAudio();
        };
    }, []);

    // Update video and mic when selection changes
    useEffect(() => {
        if (selectedCam) setupCamera(selectedCam);
    }, [selectedCam]);

    useEffect(() => {
        if (selectedMic) setupMic(selectedMic);
        else cleanupAudio();
    }, [selectedMic]);
    // Auto-select first available devices by default
useEffect(() => {
    if (devices.length > 0) {
        const firstCam = devices.find(d => d.kind === "videoinput");
        const firstMic = devices.find(d => d.kind === "audioinput");
        const firstSpeaker = devices.find(d => d.kind === "audiooutput");

        if (firstCam && !selectedCam) setSelectedCam(firstCam.deviceId);
        if (firstMic && !selectedMic) setSelectedMic(firstMic.deviceId);
        if (firstSpeaker && !selectedSpeaker) setSelectedSpeaker(firstSpeaker.deviceId);
    }
}, [devices]);


    const cams = devices.filter((d) => d.kind === "videoinput") ;
    const mics = devices.filter((d) => d.kind === "audioinput");
    const speakers = devices.filter((d) => d.kind === "audiooutput");

    return (
        <div className="space-y-6 w-full max-w-2xl mx-auto p-6">
            <h2 className="text-2xl font-bold">Device Test</h2>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {/* Camera */}
            <div className="space-y-2">
                {/* <label className="block font-medium">Camera:</label> */}
                {selectedCam && (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full max-w-md h-48 mt-2 border-8 outline-1 rounded-lg"
                    />
                )}
                <select
                    onChange={(e) => setSelectedCam(e.target.value)}
                    value={selectedCam}
                    className="w-full p-2 border-none focus:border-none bg-[#222222] text-[#f2f2f2] px-4 py-3 rounded-lg text-sm font-mono  outline-none transition-all duration-200"
                >
                    <option value=" ">Select Camera</option>
                    {cams.map((cam) => (
                        <option key={cam.deviceId} value={cam.deviceId}>
                            {cam.label || `Camera ${cam.deviceId.slice(0, 8)}...`}
                        </option>
                    ))}
                </select>

            </div>

            {/* Microphone */}
            <div className="space-y-2">
                {/* <label className="block font-medium">Microphone:</label> */}
                <select
                    onChange={(e) => setSelectedMic(e.target.value)}
                    value={selectedMic}
                    className="w-full p-2 border-none focus:border-none bg-[#222222] text-[#f2f2f2] px-4 py-3 rounded-lg text-sm font-mono  outline-none transition-all duration-200"
                >
                    <option value="">Select Microphone</option>
                    {mics.map((mic) => (
                        <option key={mic.deviceId} value={mic.deviceId}>
                            {mic.label || `Microphone ${mic.deviceId.slice(0, 8)}...`}
                        </option>
                    ))}
                </select>
                {selectedMic && (
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <span className="text-sm">Volume:</span>
                            <div className="flex-1 max-w-md h-[10px] bg-gradient-to-r from-[#222222] to-[#323232] rounded-full border border-gray-600 overflow-hidden shadow-inner relative">
                                {/* Segment markers */}
                                <div className="absolute inset-0 flex">
                                    {[...Array(15)].map((_, i) => (
                                        <div key={i} className="flex-1 border-r border-gray-600/30 last:border-r-0" />
                                    ))}
                                </div>
                                <div
                                    className="h-[10px] block relative ease-out"
                                    style={{
                                        width: `${micLevel}%`,
                                        background: micLevel > 80
                                            ? 'linear-gradient(45deg, #f59e0b, #ef4444, #dc2626)'
                                            : micLevel > 50
                                                ? 'linear-gradient(45deg, #10b981, #f59e0b, #eab308)'
                                                : 'linear-gradient(45deg, #059669, #10b981, #34d399)',
                                        boxShadow: micLevel > 50 ? `0 0 8px ${micLevel > 80 ? '#ef444440' : '#10b98140'}` : 'none',
                                    }}
                                >
                                    {/* Animated shine effect */}
                                    <div
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                        style={{
                                            animation: 'shine 2s infinite linear',
                                            transform: 'skewX(-25deg)',
                                        }}
                                    />

                                    {
                                        micLevel > 10 && (
                                            <div className="absolute right-0 top-0 w-[2px] h-full bg-white/80 animate-pulse" />
                                        )
                                    }
                                </div>

                                <div></div>

                            </div>

                            {/* <span className="text-sm w-12">{Math.round(micLevel)}%</span> */}
                        </div>
                        <p className="text-xs text-gray-600">Speak into your microphone to see the volume level</p>
                    </div>
                )}
            </div>

            {/* Speaker */}
            <div className="space-y-2">
                {/* <label className="block font-medium">Speaker:</label> */}
                <div className="flex space-x-2">
                    <select
                        onChange={(e) => setSelectedSpeaker(e.target.value)}
                        value={selectedSpeaker}
                        className="flex-1 w-full p-2 border-none focus:border-none bg-[#222222] text-[#f2f2f2] px-4 py-3 rounded-lg text-sm font-mono  outline-none transition-all duration-200"
                    >
                        <option value="">Select Speaker</option>
                        {speakers.map((spk) => (
                            <option key={spk.deviceId} value={spk.deviceId}>
                                {spk.label || `Speaker ${spk.deviceId.slice(0, 8)}...`}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={playTestSound}
                        className="px-2 py-2 bg-[#9966CC] hover:bg-[#9966cce5] text-white rounded-lg transition-colors text-sm"
                    >
                        Test Sound
                    </button>
                </div>
                <audio ref={audioRef} hidden />
            </div>
        </div>
    );
};

export default CheckDevices;