import { useCallback, useEffect, useRef, useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import {
  collection,
  doc,
  getFirestore,
  addDoc,
  setDoc,
  updateDoc,
  getDoc,
  onSnapshot,
  getDocs,
  deleteDoc,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";

import * as handpose from "@tensorflow-models/handpose";

import { drawHand } from "./utils";
import * as fp from "fingerpose";
import ThumbsDownGesture from "./gestures/ThumbsDown.js";
import MiddleFingerGesture from "./gestures/MiddleFinger.js";
import OKSignGesture from "./gestures/OKSign.js";
import PinchedFingerGesture from "./gestures/PinchedFinger.js";
import PinchedHandGesture from "./gestures/PinchedHand.js";
import RaisedHandGesture from "./gestures/RaisedHand.js";
import LoveYouGesture from "./gestures/LoveYou.js";
import RockOnGesture from "./gestures/RockOn.js";
import CallMeGesture from "./gestures/CallMe.js";
import PointUpGesture from "./gestures/PointUp.js";
import PointDownGesture from "./gestures/PointDown.js";
import PointRightGesture from "./gestures/PointRight.js";
import PointLeftGesture from "./gestures/PointLeft.js";
import RaisedFistGesture from "./gestures/RaisedFist.js";

import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";

const firebaseConfig = {
  apiKey: "AIzaSyDmHhwxA1b-LhTDSVtUDQiLJvYYSreHQPE",
  authDomain: "videome-41051.firebaseapp.com",
  projectId: "videome-41051",
  storageBucket: "videome-41051.firebasestorage.app",
  messagingSenderId: "1077052000045",
  appId: "1:1077052000045:web:60b98be84bba60b46435a4",
  measurementId: "G-WEBW7QMJXC",
};

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const firestore = getFirestore(app);

const servers = {
  iceServers: [
    {
      urls: [
        "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302",
        "stun:stun2.l.google.com:19302",
        "stun:stun3.l.google.com:19302",
        "stun:stun4.l.google.com:19302",
      ],
    },
  ],
  iceCandidatePoolSize: 10,
};

export default function App() {
  const localVideoRef = useRef(null);
  const canvasRef = useRef();
  const remoteVideoRef = useRef();
  const inputRef = useRef();
  const [pc, setPc] = useState(new RTCPeerConnection(servers));
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(new MediaStream());
  const [callId, setCallId] = useState("");
  const [callActive, setCallActive] = useState(false);
  const [isWebSocketActive, setIsWebSocketActive] = useState(false);
  const [gesture,setGesture] = useState("")

  const initTF = async () => {
    try {
      await tf.setBackend("webgl"); // Or "wasm" for more efficiency on some devices
      await tf.ready();
      console.log("TensorFlow is ready!");
    } catch (err) {
      console.error("TensorFlow backend error:", err);
    }
  };

  const startWebcam = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
    };

    remoteVideoRef.current.srcObject = remoteStream;
    initTF();
  };

  const createCall = async () => {
    const callDoc = doc(collection(firestore, "calls"));
    const offerCandidates = collection(callDoc, "offerCandidates");
    const answerCandidates = collection(callDoc, "answerCandidates");

    setCallId(callDoc.id);
    inputRef.current.value = callDoc.id;

    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        await addDoc(offerCandidates, event.candidate.toJSON());
      }
    };

    const offerDescription = await pc.createOffer();
    await pc.setLocalDescription(offerDescription);

    await setDoc(callDoc, {
      offer: { sdp: offerDescription.sdp, type: offerDescription.type },
    });

    onSnapshot(callDoc, (snapshot) => {
      const data = snapshot.data();
      if (!pc.currentRemoteDescription && data?.answer) {
        pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    });

    onSnapshot(answerCandidates, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
        }
      });
    });

    setCallActive(true);
  };

  const answerCall = async () => {
    // startWebSocket();
    const callDoc = doc(firestore, "calls", inputRef.current.value);
    const answerCandidates = collection(callDoc, "answerCandidates");
    const offerCandidates = collection(callDoc, "offerCandidates");

    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        await addDoc(answerCandidates, event.candidate.toJSON());
      }
    };

    const callData = (await getDoc(callDoc)).data();
    await pc.setRemoteDescription(new RTCSessionDescription(callData.offer));

    const answerDescription = await pc.createAnswer();
    await pc.setLocalDescription(answerDescription);
    await updateDoc(callDoc, {
      answer: { sdp: answerDescription.sdp, type: answerDescription.type },
    });

    onSnapshot(offerCandidates, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
        }
      });
    });

    setCallActive(true);
  };

  const hangUp = async () => {
    const callDoc = doc(firestore, "calls", callId);
    const offerCandidatesRef = collection(callDoc, "offerCandidates");

    const offerSnapshot = await getDocs(offerCandidatesRef);
    offerSnapshot.forEach((docSnap) => deleteDoc(docSnap.ref));
    await deleteDoc(callDoc);

    pc.close();
    setLocalStream(null);
    setRemoteStream(new MediaStream());
    setCallActive(false);
    inputRef.current.value = "";
    localVideoRef.current.srcObject = null;
    remoteVideoRef.current.srcObject = null;
  };

  const runHandpose = async () => {
    console.log("runpose is called");
    const net = await handpose.load();
    // Reduce interval time from 100ms to 50ms for faster response
    setInterval(() => {
      detect(net);
    }, 500);
  };

  const detect = async (net) => {
    if (
      typeof remoteVideoRef.current !== "undefined" &&
      remoteVideoRef.current != null &&
      remoteVideoRef.current.readyState === 4 
    ) {
      const video = remoteVideoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvasRef.current.getContext("2d");

      const hand = await net.estimateHands(video);
      drawHand(hand, ctx);
      console.log("hand is initialised", hand);

      if (hand.length > 0) {
        const GE = new fp.GestureEstimator([
          fp.Gestures.VictoryGesture,
          fp.Gestures.ThumbsUpGesture,
          ThumbsDownGesture,
          OKSignGesture,
          PinchedFingerGesture,
          PinchedHandGesture,
          RaisedHandGesture,
          LoveYouGesture,
          RockOnGesture,
          CallMeGesture,
          PointRightGesture,
          PointUpGesture,
          PointLeftGesture,
          PointDownGesture,
          RaisedFistGesture,
          // aSign,
          // bSign,
          // cSign,
          // dSign,
          // eSign,
          // fSign,
          // gSign,
          // hSign,
          // iSign,
          // jSign,
          // kSign,
          // lSign,
          // mSign,
          // nSign,
          // oSign,
          // pSign,
          // qSign,
          // rSign,
          // sSign,
          // tSign,
          // uSign,
          // vSign,
          // wSign,
          // xSign,
          // ySign,
          // zSign,
        ]);
        const gesture = await GE.estimate(hand[0].landmarks, 8);
        if (gesture.gestures !== undefined && gesture.gestures.length > 0) {
          const confidence = gesture.gestures.map(
            (prediction) => prediction.score
          );
          const maxConfidence = confidence.indexOf(
            Math.max.apply(null, confidence)
          );
          const gestureName = gesture.gestures[maxConfidence].name;
          const confidenceScore = gesture.gestures[maxConfidence].score;

          // Lower confidence threshold from 0.7 to 0.6 for faster response
          if (confidenceScore > 0.6) {
            console.log("confidenceScore :", confidenceScore);
            // setEmoji(gestureName);
            console.log(gestureName);
            setGesture(gestureName)
            // if (isSender && dataChannel.current?.readyState === "open") {
            //   const message = JSON.stringify({
            //     type: "gesture",
            //     name: gestureName,
            //     confidence: confidenceScore,
            //   });
            //   dataChannel.current.send(message);
            // }
          }
        }
      }
    }
  };

  useEffect(() => {
    if (localVideoRef.current) {
      
      runHandpose();
      console.log("runpose is called");
    }
  }, [localVideoRef]);

  return (
    <div className="h-[100vh] bg-gray-900 text-white p-6 space-y-4 text-center">
      <h2 className="text-xl font-bold">Start your webcam</h2>
      <button
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        onClick={startWebcam}
      >
        Start Webcam
      </button>

      {/* Call button to generate the code and Call input to answer */}
      {!callActive && (
        <div>
          <h2 className="text-xl font-bold">Create a new call</h2>
          <button
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            onClick={createCall}
          >
            Call
          </button>
        </div>
      )}
      <div>
        <h2 className="text-xl font-bold">Join a call</h2>
        <input
          ref={inputRef}
          className="border px-2 py-1 rounded mr-2"
          type="text"
          placeholder="Enter call ID"
        />
        <button
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
          onClick={answerCall}
        >
          Answer
        </button>
      </div>

      {/* Video  */}
      <div className="flex justify-center gap-6 mt-6">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="w-1/2 border rounded"
        />
        <canvas
          ref={canvasRef}
          style={{
            
            position: "absolute",
            top: 250,
            left: 700,
            
          }}
          className="w-1/2"
        />

        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-1/2 border rounded"
        />
      </div>

      <div style={{ marginTop: '20px' }} className="sm:text-3xl bg-white-200 p-3">
        {gesture ? `Recognized Gesture: ${gesture}` : 'Waiting for gesture...'}
      </div>

      {/* Hang Up button */}
      {callActive && (
        <button
          className="mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          onClick={hangUp}
        >
          Hang Up
        </button>
      )}
    </div>
  );
}
