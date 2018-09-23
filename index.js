const ffmpeg = require("fluent-ffmpeg");
const _ = require("lodash");
const electron = require("electron");
const { app, BrowserWindow, ipcMain, shell  } = electron;

let mainWindow;

app.on("ready", () => {
    mainWindow = new BrowserWindow({
        width:800,
        height:600,
        webPreferences: {
            backgroundThrottling: false
        }
    });

    mainWindow.loadURL(`file://${__dirname}/src/index.html`);
})

ipcMain.on("videosadded", (event, videos) => {

    /*videos.forEach(vid => {
        const promise = new Promise( (resolve, reject) => {
            ffmpeg.ffprobe(vid.path, (err, metadata) => {
                resolve(metadata);
            });
        });

        promise.then( (metadata) => {
            console.log(metadata);
        });
    
    });*/

    const promises = videos.map((video) => {
        return new Promise( (resolve, reject) => {
            ffmpeg.ffprobe(video.path, (err, metadata) => {
                video.duration = metadata.format.duration;
                video.format = "avi";
                resolve(video);
            })
        });
    });

    Promise.all(promises).then(
        (results) => {
            mainWindow.webContents.send("datareceived", results);
        }
    );

});

ipcMain.on("conversionstarted", (event, videos) => {

    videos.forEach(video => {
        const outputDirectory = video.path.split(video.name)[0];
        const outputName = video.name.split(".")[0];
        const outputPath = `${outputDirectory}${outputName}.${video.format}`
      
        ffmpeg(video.path)
            .output(outputPath)
            .on('end', () => mainWindow.webContents.send('conversionended', { video: video, outputPath: outputPath}) )
            .on('progress', (event) => {
                mainWindow.webContents.send("conversionprogress", {video:video, timemark:event.timemark} )
            })
            .run();

    });
    
});

ipcMain.on("openfolder", (event, outputPath) => {
    shell.showItemInFolder(outputPath);
});