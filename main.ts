import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';


interface Quality {
    resolution: string;
    bitrate: string;
    maxrate: string;
    bufsize: string;
    file: string;
    name: string;
    segments: string;
}


class VideoConverter {
    private inputFolder: string = "video";
    private outputPath: string;
    private inputVideoCleanUp: false | string = false; // Set to true if you want to delete the input video after conversion


    /**
     * Creates an instance of VideoConverter.
     * @param inputFolder - The folder containing the input video file.
     * @param outputPath - The path where the output files will be saved.
     * @param inputVideoCleanUp - If true, the input video will be deleted after conversion.
     */

    constructor(
        inputFolder: string,
        outputPath: string = "output",
        inputVideoCleanUp: false | string = false

    ) {
        this.inputFolder = inputFolder;
        this.inputVideoCleanUp = inputVideoCleanUp;
        if (inputVideoCleanUp && typeof inputVideoCleanUp === 'string') {
            this.inputVideoCleanUp = inputVideoCleanUp;
        }
        this.outputPath = outputPath;


    }


    /**
     * Converts the input video file to HLS format with multiple qualities.
     * 
     * @param inputFileName - The name of the input video file.
     * @param progressCallback - Optional callback function to report conversion progress.
     * @param resolutionArray - Array of resolution names (e.g., ['120', '240', '360', '420', '720']). Defaults to common resolutions.
     * @param video_id - Optional unique identifier for the video, used to create a unique output folder.
     * @param qualityArray - Optional array of Quality objects defining the output qualities.
     * 
     * Each Quality object should have the following properties:
     *   - resolution: string (e.g., "1280x720")
     *   - bitrate: string (e.g., "2800k")
     *   - maxrate: string (e.g., "2996k")
     *   - bufsize: string (e.g., "4200k")
     *   - file: string (e.g., "720p.m3u8")
     *   - name: string (e.g., "720")
     *   - segments: string (e.g., "720p_%03d.ts")
     * 
     * Example:
     * [
     *   { resolution: "120x68", bitrate: "100k", maxrate: "107k", bufsize: "150k", file: "120p.m3u8", name: "120", segments: "120p_%03d.ts" },
     *   { resolution: "640x360", bitrate: "800k", maxrate: "856k", bufsize: "1200k", file: "360p.m3u8", name: "360", segments: "360p_%03d.ts" },
     *   { resolution: "1280x720", bitrate: "2800k", maxrate: "2996k", bufsize: "4200k", file: "720p.m3u8", name: "720", segments: "720p_%03d.ts" }
     * ]
     */
    async hlsConvert(
        inputFileName: string,
        progressCallback?: (progress: { quality: string, percent: number },) => void,
        resolutionArray?: Array<string>,
        video_id?: string,
        qualityArray?: Array<Quality>
    ): Promise<void> {
        try {



            let quality: Quality[] = [];




            if (!qualityArray || qualityArray.length === 0) {
                quality = [
                    { resolution: "120x68", bitrate: "100k", maxrate: "107k", bufsize: "150k", file: "120p.m3u8", name: "120", segments: "120p_%03d.ts" },
                    { resolution: "160x90", bitrate: "150k", maxrate: "160k", bufsize: "200k", file: "160p.m3u8", name: "160", segments: "160p_%03d.ts" },
                    { resolution: "240x135", bitrate: "200k", maxrate: "214k", bufsize: "300k", file: "240p.m3u8", name: "240", segments: "240p_%03d.ts" },
                    { resolution: "320x180", bitrate: "350k", maxrate: "375k", bufsize: "500k", file: "180p.m3u8", name: "180", segments: "180p_%03d.ts" },
                    { resolution: "426x240", bitrate: "400k", maxrate: "428k", bufsize: "600k", file: "240p_wide.m3u8", name: "240w", segments: "240pw_%03d.ts" },
                    { resolution: "480x270", bitrate: "500k", maxrate: "535k", bufsize: "750k", file: "270p.m3u8", name: "270", segments: "270p_%03d.ts" },
                    { resolution: "640x360", bitrate: "800k", maxrate: "856k", bufsize: "1200k", file: "360p.m3u8", name: "360", segments: "360p_%03d.ts" },
                    { resolution: "854x480", bitrate: "1400k", maxrate: "1498k", bufsize: "2100k", file: "480p.m3u8", name: "480", segments: "480p_%03d.ts" },
                    { resolution: "960x540", bitrate: "2000k", maxrate: "2140k", bufsize: "3000k", file: "540p.m3u8", name: "540", segments: "540p_%03d.ts" },
                    { resolution: "1280x720", bitrate: "2800k", maxrate: "2996k", bufsize: "4200k", file: "720p.m3u8", name: "720", segments: "720p_%03d.ts" },
                    { resolution: "1920x1080", bitrate: "5000k", maxrate: "5350k", bufsize: "7500k", file: "1080p.m3u8", name: "1080", segments: "1080p_%03d.ts" },
                    { resolution: "2560x1440", bitrate: "8000k", maxrate: "8560k", bufsize: "12000k", file: "1440p.m3u8", name: "1440", segments: "1440p_%03d.ts" },
                    { resolution: "3840x2160", bitrate: "14000k", maxrate: "14980k", bufsize: "21000k", file: "2160p.m3u8", name: "2160", segments: "2160p_%03d.ts" },
                ];
            }

            // Ensure each quality object has the required properties
            quality.forEach(q => {
                if (!q.resolution || !q.bitrate || !q.maxrate || !q.bufsize || !q.file || !q.name || !q.segments) {
                    return Promise.reject({ message: "Each quality object must have resolution, bitrate, maxrate, bufsize, file, name, and segments properties." });
                }
            });

            let finalQuality: Quality[] = [];

            let resolution: string[] = ['120', '240', '360', '480', '720'];
            if (resolutionArray && Array.isArray(resolutionArray) && resolutionArray.length > 0) {
                resolution = resolutionArray;
            }
            // Filter the quality array based on the provided resolutions
            if (!Array.isArray(resolution) || resolution.length === 0) {
                return Promise.reject({ message: "Invalid resolution array provided. It should be an array of strings." });
            }
            // Ensure all elements in the resolution array are strings
            if (resolution.some(res => typeof res !== 'string')) {
                return Promise.reject({ message: "All elements in the resolution array must be strings." });
            }

            // Make sure the resolution names match the quality names
            resolution.forEach((res) => {
                if (typeof res !== 'string') {
                    throw new Error(`Invalid resolution name: ${res}. It should be a string.`);
                }
                if (!quality.some(q => q.name === res)) {
                    throw new Error(`Invalid resolution name: ${res}. It does not match any quality name. Valid names are ${quality.map(q => q.name).join(', ')}.`);
                }
            });



            // Filter the quality array to include only those that match the provided resolutions
            finalQuality = quality.filter(q => resolution.includes(q.name));

            if (finalQuality.length === 0) {
                return Promise.reject({ message: "No valid resolutions provided for conversion." });
            }
            if (!inputFileName) {
                return Promise.reject({ message: "Input file name is required." });
            }
            const inputPath = path.join(this.inputFolder, inputFileName);
            console.log(`Converting video from ${inputPath} to HLS format at ${this.outputPath}`);
            if (!fs.existsSync(inputPath)) {
                return Promise.reject({ message: `Input file does not exist: ${inputPath}` });
            }
            if (!fs.existsSync(this.outputPath)) {
                fs.mkdirSync(this.outputPath, { recursive: true });
            }

            // Create a unique output folder for this conversion
            const uniqueOutputPath = path.join(this.outputPath, video_id ? video_id : uuidv4());
            if (!fs.existsSync(uniqueOutputPath)) {
                fs.mkdirSync(uniqueOutputPath, { recursive: true });
            }

            // Process all qualities in parallel
            await Promise.all(
                finalQuality.map(quality =>
                    new Promise<void>((resolve, reject) => {
                        console.log(`Processing quality: ${quality.name} (${quality.resolution})`);
                        let lastPercent = 0;
                        ffmpeg(inputPath)
                            .videoBitrate(quality.bitrate)
                            .audioBitrate('96k')
                            .size(quality.resolution)
                            .outputOptions([
                                `-maxrate ${quality.maxrate}`,
                                `-bufsize ${quality.bufsize}`,
                                `-hls_time 10`,
                                `-hls_list_size 0`,
                                `-hls_segment_filename ${path.join(uniqueOutputPath, quality.segments)}`,
                                `-hls_flags independent_segments`,
                                `-hls_playlist_type vod`,
                                `-threads 1`,
                                `-preset veryfast`
                            ])
                            .output(path.join(uniqueOutputPath, quality.file))
                            .on('start', (cmdLine) => {
                                console.log('Spawned ffmpeg with command:', cmdLine);
                            })
                            .on('progress', (progress) => {
                                if (typeof progress.percent === 'number') {
                                    lastPercent = Math.floor(progress.percent);
                                    if (typeof progressCallback === 'function') {
                                        progressCallback({ quality: quality.name, percent: lastPercent });
                                    }
                                }
                            })
                            .on('stderr', (stderrLine) => {
                                if (stderrLine.toLowerCase().includes('error')) {
                                    console.error('ffmpeg stderr:', stderrLine);
                                }
                            })
                            .on('end', () => {
                                if (typeof progressCallback === 'function') {
                                    progressCallback({ quality: quality.name, percent: 100 });
                                }
                                // remove the input video if cleanup is enabled
                                if (this.inputVideoCleanUp) {
                                    try {
                                        fs.unlinkSync(inputPath);
                                        console.log(`Input video ${inputFileName} deleted after conversion.`);
                                    } catch (err) {
                                        console.error(`Failed to delete input video: ${err}`);
                                    }
                                }
                                console.log(`HLS conversion for ${quality.name} completed.`);
                                resolve();
                            })
                            .on('error', (err) => {
                                console.error(`Error during HLS conversion for ${quality.name}:`, err);
                                reject(err);
                            })
                            .run();
                    })
                )
            );

            // Generate the master playlist after all conversions are done
            const masterPlaylistPath = path.join(uniqueOutputPath, "master.m3u8");
            const masterPlaylistContent = finalQuality.map(q =>
                `#EXT-X-STREAM-INF:BANDWIDTH=${parseInt(q.bitrate) * 1000},RESOLUTION=${q.resolution}\n${q.file}`
            ).join("\n");
            const masterPlaylistHeader = "#EXTM3U\n";
            fs.writeFileSync(masterPlaylistPath, masterPlaylistHeader + masterPlaylistContent);
            console.log("Master playlist generated at", masterPlaylistPath);

            console.log('All HLS conversions completed successfully.');
        } catch (error: any) {
            throw error;
        }
    }

}



export default VideoConverter;
export { VideoConverter };