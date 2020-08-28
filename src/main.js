var AWS = require('aws-sdk');
var moment = require('moment');
const axios = require('axios');
var fs = require('fs');
var path = require('path');
var credentials = new AWS.SharedIniFileCredentials({ profile: 'personal-account' });
AWS.config.credentials = credentials;
AWS.config.update({ region: 'us-east-1' });
// Create S3 service object
s3 = new AWS.S3({ apiVersion: '2006-03-01' });


const bucketName = 'syth-pdf-bucket';
var originalFilePath = '/Users/wennis/projects/pdf-pickup-tester/files/100Page.pdf';

const { v4: uuidv4 } = require('uuid');


async function uploadS3Object(uploadParams) {
    try {

        let response = await s3.upload(uploadParams).promise();
        return response.Key;

    } catch (error) {
        console.error(error);
    }
}
async function callApiGateway(apiGateWayUrl) {
    try {

        var response = await axios.get(apiGateWayUrl)
            .then(resp => {
                return resp.data;
            }).catch(error => {
                console.log(error);
            });
        return response;
    } catch (error) {
        console.log(`Caught Error when calling api Gateway ${error}`);
    }
}

async function downloadS3Object(key,outputFolder){
    try {
        let destinationFile = `${outputFolder}/${key.split('/')[1]}`;
       // console.log("Downloading File to:" + destinationFile);
        var downloadParams = {
            Bucket: bucketName,
            Key: key
        };
        var dlFile = fs.createWriteStream(destinationFile);
        var resp = await s3.getObject(downloadParams).promise();
         dlFile.write(resp.data)
        
    } catch (error) {
        
    }
}

function logMessage(message){
    console.log('');
    console.log('');
    console.log('*********************************');
    console.log(message);
    console.log('*********************************');
    console.log('');
    console.log('');
}

//upload files
//create a new file Key



(async () => {

    var totalStartTime = moment();
    var fileObj = path.parse(originalFilePath);
    var prefix = `${fileObj.name}-${uuidv4()}`;
    var newKey = `${prefix}${fileObj.ext}`;

    console.log(`Processing file: ${path.basename(originalFilePath)}`);
    var fileStream = fs.createReadStream(originalFilePath);
    fileStream.on('error', function (err) {
        console.log('File Error', err);

    });
    var uploadParams = {
        Bucket: bucketName,
        Key: newKey,
        Body: fileStream
    };


    console.log('Beginning Upload to S3');
    let s3UploadTime = moment();
    var objectKey = await uploadS3Object(uploadParams);
    let s3EndTime = moment();
    logMessage(`Upload to S3 took: ${s3EndTime.diff(s3UploadTime, 'milliseconds')} ms`)

    



    //Call Lambda and get a list of ObjectKeys
    let apiUrl = `https://mu6vmjfnf1.execute-api.us-east-1.amazonaws.com/Prod/api/Documents?key=${objectKey}`;

    console.log('Calling Api Gateway to convert Pdf into PNG');
    let apiCallStartTime = moment();
    var objectKeys = await callApiGateway(apiUrl);
    let apiCallEndTime = moment();
    logMessage(`Call to Convert document took ${apiCallEndTime.diff(apiCallStartTime, 'milliseconds')} ms`);



    //Download all of the Documents

    let outputFolder = `./output/${prefix}`;
    //Make Output Folder
    if (!fs.existsSync("./output")) {
        fs.mkdirSync("./output");
    }
    //Make Folder Specific to the File

    if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder);
    }

    //Loop Through All The ObjectKeys 
    console.log('Downloading Documents from S3 and Saving to local File system');
    let s3DownloadTimeStart = moment();

    for(let i =0;i<objectKeys.length;i++){
        //console.log("Attempting to Download: " + objectKeys[i]);
        await downloadS3Object(objectKeys[i],outputFolder);
    }
    let s3DownloadTimeEnd = moment();
    logMessage(`Downloading Objects from S3 took: ${s3DownloadTimeEnd.diff(s3DownloadTimeStart,'milliseconds')} ms`);
    


    var endTime = moment();
    logMessage(`Total Elapsed Time: ${endTime.diff(totalStartTime,'milliseconds')} ms`);
})();