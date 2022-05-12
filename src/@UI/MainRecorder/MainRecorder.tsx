import React, { FC, memo, useEffect, useRef, useState } from "react";
import {
  Box,
  Icon,
  Theme,
  Button,
  useTheme,
  SimpleGrid,
  IconButton,
  Input,
} from "@chakra-ui/react";
import { FaVideoSlash, FaDownload, FaCamera } from "react-icons/fa";
import "video-react/dist/video-react.css";
// @ts-ignore
import { Player } from "video-react";
// @ts-ignore
import RecordRTC, {
  // @ts-ignore
  RecordRTCPromisesHandler,
} from "recordrtc";
import { saveAs } from "file-saver";

const MainRecorder: FC = () => {
  const theme: Theme = useTheme();
  const [recorder, setRecorder] = useState<RecordRTC | null>();
  const [stream, setStream] = useState<MediaStream | null>();
  const [videoBlob, setVideoUrlBlob] = useState<Blob | null>();
  const [type, setType] = useState<"video" | "screen">("video");
  const [recordingStatus, setRecordingStatus] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  let accessKey = '';
  let secretKey = '';
  let streamName = '';
  let filePath = '';

  useEffect(() => {
    getVideo();
  }, [videoRef]);

  const getVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: { width: 300 } })
      .then((stream) => {
        let video = videoRef.current;
        video!.srcObject = stream;
        video!.play();
      })
      .catch((err) => {
        console.error("error:", err);
      });
  };

  const handleLogin = (event: any) => {
    event.preventDefault();
    accessKey = event.target.form[0].value;
    secretKey = event.target.form[1].value;
    streamName = event.target.form[2].value;
    filePath = event.target.form[3].value;
    console.log(event)
    console.log(accessKey)
    console.log(secretKey)
    console.log(streamName)
    console.log(filePath)
  }

  const startRecording = async () => {
    setRecordingStatus(false);
    getVideo();
    const mediaDevices = navigator.mediaDevices;
    const stream: MediaStream =
      type === "video"
        ? await mediaDevices.getUserMedia({
          video: true,
          audio: true,
        })
        : await (mediaDevices as any).getDisplayMedia({
          video: true,
          audio: false,
        });
    const recorder: RecordRTC = new RecordRTCPromisesHandler(stream, {
      type: 'video',
      mimeType: 'video/x-matroska;codecs=avc1',
      frameRate: 30,
      bitrate: 128000,
      bitsPerSecond: 128000
    })

    await recorder.startRecording();
    setRecorder(recorder);
    setStream(stream);
    setVideoUrlBlob(null);
  };

  const stopRecording = async () => {
    if (recorder) {
      await recorder.stopRecording();
      const blob: Blob = await recorder.getBlob();
      (stream as any).stop();
      setVideoUrlBlob(blob);
      setStream(null);
      setRecorder(null);
      setRecordingStatus(true);
    }
  };

  const downloadVideo = () => {
    if (videoBlob) {
      const mp4File = new File([videoBlob], 'demo.ts', { type: "video/webm" })
      //let blob = new Blob([videoBlob], { type: "video/mp4" })
      saveAs(mp4File, `Video-${Date.now()}.mkv`)
      const payload = new FormData();
      payload.append('video', mp4File);
      const requestOptions = {
        method: 'POST',
        body: payload
      };
    console.log("Inside download", accessKey)
    console.log(secretKey)
    console.log(streamName)
    console.log(filePath)
      fetch(`http://localhost:5001/config?AWS_ACCESS_KEY_ID=${accessKey}&AWS_SECRET_ACCESS_KEY=${secretKey}&my-stream-name=${streamName}&video-path=${encodeURIComponent(filePath)}`, requestOptions)
        .then(response => console.log(response))
      // saveAs(videoBlob, `Video-${Date.now()}.webm`)
    }
  };

  const changeType = () => {
    if (type === "screen") {
      setType("video");
      getVideo();
    } else {
      setType("screen");
    }
  };

  return (
    <SimpleGrid spacing="5" p="5">
      <Box
        display="flex"
        justifyContent="center"
        flexDirection={[
          "column", // 0-30em
          "row", // 30em-48em
          "row", // 48em-62em
          "row", // 62em+
        ]}
      >
        <Button
          m="1"
          bg={theme.colors.blue[600]}
          size="lg"
          aria-label="start recording"
          color="white"
          onClick={changeType}
        >
          {type === "screen" ? "Record Screen" : "Record Video"}
        </Button>
        <IconButton
          m="1"
          bg={theme.colors.blue[600]}
          size="lg"
          aria-label="start recording"
          color="white"
          onClick={startRecording}
          icon={<Icon as={FaCamera} />}
        />
        <IconButton
          m="1"
          bg={theme.colors.blue[600]}
          size="lg"
          color="white"
          aria-label="stop recording"
          onClick={stopRecording}
          disabled={recorder ? false : true}
          icon={<Icon as={FaVideoSlash} />}
        />
        <IconButton
          bg={theme.colors.blue[600]}
          m="1"
          size="lg"
          disabled={!!!videoBlob}
          color="white"
          onClick={downloadVideo}
          aria-label="download video"
          icon={<Icon as={FaDownload} />}
        />
      </Box>

      {!recordingStatus && type === "video" ? (
        <div
          className="cam-feed"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <video style={{ height: "600px", width: "800px" }} ref={videoRef} />
        </div>
      ) : (
        <Box display="flex" justifyContent="center">
          <Box
            bg={!!videoBlob ? "inherit" : "blue.50"}
            h="50vh"
            width={[
              "100%", // 0-30em
              "100%", // 30em-48em
              "50vw", // 48em-62em
              "50vw", // 62em+
            ]}
          >
            {!!videoBlob && (
              <Player src={window.URL.createObjectURL(videoBlob)} />
            )}
          </Box>
        </Box>
      )}

      <Box
        display="flex"
        justifyContent="center"
        flexDirection={[
          "column", // 0-30em
          "row", // 30em-48em
          "row", // 48em-62em
          "row", // 62em+
        ]}
      >
        <form>
          <div>
          <label style={{"display": "inline-block", "width": "100px"}} htmlFor="accessKey">Access Key: </label>
          <Input bg="white" style={{padding:"8px", margin: "12px", width: "200px", color: "black"}} type="text" name="accessKey" />
        </div>
        <div>
        <label style={{"display": "inline-block", "width": "100px"}} htmlFor="secretKey">Secret Key: </label>
        <Input bg="white" style={{padding:"8px", margin: "12px", width: "200px", color: "black"}} type="text" name="secretKey" />
        </div>
        <div>
        <label style={{"display": "inline-block", "width": "100px"}} htmlFor="streamName">Stream Name: </label>
        <Input bg="white" style={{padding:"8px", margin: "12px", width: "200px", color: "black"}} type="text" name="streamName" />
        </div>
        <div>
        <label style={{"display": "inline-block", "width": "100px"}} htmlFor="filePath">File Path: </label>
        <Input bg="white" style={{padding:"8px", margin: "12px", width: "200px", color: "black"}} type="text" name="filePath" />
        </div>
        <Button marginLeft="110px" display="flex" justifyContent="center" onClick={handleLogin} colorScheme='blue'>Submit</Button>
        {/* <button type="button" onClick={handleLogin}>Submit</button> */}
      </form>
    </Box>
    </SimpleGrid >
  );
};

export default memo(MainRecorder);
