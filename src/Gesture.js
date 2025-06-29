import { drawHand } from "./utils";
export const runHandpose = async () => {
    const net = await handpose.load();
    // Reduce interval time from 100ms to 50ms for faster response
    setInterval(() => {
      detect(net);
    }, 50);
  };

  const detect = async (net) => {
    if (typeof webcamRef.current !== "undefined" && 
        webcamRef.current != null && 
        webcamRef.current.video.readyState === 4) {
      
      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;
      
      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;
      
      const hand = await net.estimateHands(video);

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
          const confidence = gesture.gestures.map(prediction => prediction.score);
          const maxConfidence = confidence.indexOf(Math.max.apply(null, confidence));
          const gestureName = gesture.gestures[maxConfidence].name;
          const confidenceScore = gesture.gestures[maxConfidence].score;
          
          // Lower confidence threshold from 0.7 to 0.6 for faster response
          if (confidenceScore > 0.6) {
            console.log('confidenceScore :', confidenceScore);
            setEmoji(gestureName);
            
            if (isSender && dataChannel.current?.readyState === "open") {
              const message = JSON.stringify({
                type: "gesture",
                name: gestureName,
                confidence: confidenceScore
              });
              dataChannel.current.send(message);
            }
          }
        }
      }

      const ctx = canvasRef.current.getContext("2d");
      drawHand(hand, ctx);
    }
  };