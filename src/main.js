var AWS = require('aws-sdk');
var moment = require('moment');

var credentials = new AWS.SharedIniFileCredentials({profile: 'personal-account'});
AWS.config.credentials = credentials;
AWS.config.update({region: 'us-east-1'});
// Create S3 service object
s3 = new AWS.S3({apiVersion: '2006-03-01'});

const bucketName = 'syth-pdf-bucket';


  

    //mark current time
  var startTime = moment();



  //upload files
  //create a new file Key
  var originalFilePath = '/Users/wennis/projects/pdf-pickup-tester/files/100Page.pdf';
  var fs = require('fs');
  var path = require('path');
  const { v4: uuidv4 } = require('uuid');
const { S3 } = require('aws-sdk');

  var fileObj = path.parse(originalFilePath);
    var prefix = `${fileObj.name}-${uuidv4()}`
    var newKey = `${prefix}/${prefix}${fileObj.ext}`

    var fileStream = fs.createReadStream(originalFilePath);
    fileStream.on('error', function(err) {
      console.log('File Error', err);
      
    });
  var uploadParams = {
        Bucket: bucketName,
        Key: newKey,
        Body: ''
    };

    uploadParams.Body = fileStream;

    const 
    promisify = require('util').promisify,
    bindClient = promisify(s3.upload);
  

//   var uploadRequest = await s3.upload(uploadParams).promis();
//   uploadRequest.then()
    // s3.upload (uploadParams, function (err, data) {
    //     if (err) {
    //       console.log("Error", err);
    //     } if (data) {
    //       console.log("Upload Success", data.Location);
    //     }
    //   });
(async ()=>{
    console.log('making Promised Call');
    var uploadRequest = await s3.upload(uploadParams).promise();
     console.log(uploadRequest.Location);
})();

//Call Lambda to get pngs
 




  //Retrieve PNGs from S3

  //Stop Time
  var endTime = moment();

  console.log(endTime.diff(startTime, 'miliseconds'));
  