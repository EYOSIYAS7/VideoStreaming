const express = require("express");
const mongodb = require("mongodb");
const mongoose = require("mongoose");
const fs = require("fs");
const app = express();
const conn = mongoose.createConnection(process.env.mongo_url);
//  to upload a video
app.get("/uploadV", (req, res) => {
  if (conn) {
    const bucket = new mongodb.GridFSBucket(conn);
    const videoUploadStream = bucket.openUploadStream("bigbuck");
    const videoReadStream = fs.createReadStream("./video1.mp4");
    videoReadStream.pipe(videoUploadStream);
    res.status(200).send("Done");
  } else {
    return res.json({ message: "video upload failed" });
  }
});
//  to get the video from db
app.get("/downloadV", (req, res) => {
  const range = req.headers.range;
  if (!range) {
    res.status(400).send("Required range header");
  }

  conn.collection("fs.files").findOne({}, (err, video) => {
    if (!video) {
      return res.status(404).send("no video uploaded");
    }

    const VSize = video.length;
    const start = Number(range.replace(/\D/g, ""));
    const end = VSize - 1;

    const contentLength = end - start + 1;

    const headers = {
      "Content-Range": `byte ${start} -${end}/${VSize}`,
      "Accept-Range": "byte",
      "Content-Length": contentLength,
      "Content-Type": "video/mp4",
    };
    res.writeHead(206, headers);

    const bucket = new mongodb.GridFSBucket(conn);
    const downloadStream = bucket.openDownloadStreamByName("bigbuck", {
      start,
    });

    downloadStream.pie(res);
  });
});
app.listen(5050, () => {
  console.log("listening on port 5050");
});
