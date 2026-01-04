import express from "express"
import cors from "cors"
import multer from "multer"
import {v4 as uuidv4} from "uuid"
import path from "path"
import fs from "fs"
import { exec } from "child_process"
import { error } from "console"
import { stderr, stdout } from "process"




const app = express();

const Port = 8000;

app.use(cors({
    origin: ["http://localhost:5173","http://localhost:3000"],
    credentials: true
}));

const storage = multer.diskStorage({
    destination: function(req,file,cd)
    {
        cd(null,"./uploads")
    },
    filename: function(req,file,cb)
    {
        cb(null,`${file.fieldname}-${uuidv4()}${path.extname(file.originalname)}`);
    }
});

// multer config

const upload = multer({storage: storage});

app.use((req,res,next) => {
    res.header("Access-Control-Allow-Headers","Origin,X-Requested-With,Content-Type,Accept");
    next();
})


app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use("/upload",express.static("uploads"));

// Routes

app.get("/",function(req,res){

    res.json({message:"Welcome to video server...."});
});

app.post("/upload",upload.single('file'),function(req,res){

    const VideoID = uuidv4();
    const VideoPath = req.file.path;
    const OutputPath = `./uploads/videos/${VideoID}`;
    const hlsPath = `${OutputPath}/index.m3u8`;
    if(!fs.existsSync(OutputPath))
    {
        fs.mkdirSync(OutputPath,{recursive:true});
    }

    // ffmpeg
    const ffmpegCommand = `ffmpeg -i ${VideoPath} -codec:v libx264 -codec:a aac -hls_time 10 -hls_playlist_type vod -hls_segment_filename "${OutputPath}/segment%03d.ts" -start_number 0 ${hlsPath}`;

    // this is not done in production

    exec(ffmpegCommand,(error,stdout,stderr) => {
        if(error)
        {
            console.log(`exec Error : ${error}`);
        }
        console.log(`stdOut: ${stdout} /`);
        console.log(`Stderr: ${stderr} /`);

        const videoUrl = `http://localhost:8000/uploads/videos/${VideoID}/index.m3u8`;

        res.json({
            message:"File Uploaded...",    
            VideoUrl: videoUrl,
            VideoID: VideoID
        });
    })

});



app.listen(Port,() => console.log(`Server is up at Port : ${Port}`));