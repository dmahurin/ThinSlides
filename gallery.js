/*
ThinGallery
===========

https://github.com/gfwilliams/ThinGallery

Copyright 2016 Gordon Williams, gw@pur3.co.uk (Licensed as MPLv2)

A single-file gallery webpage. This uses EXIF thumbnails, XMLHttpRequest Range headers,
and your web server's own index pages to quickly display thumbnails for a directory without
having to fully load every image file, and without needing ANY server-side scripting.

*/

var THUMB_SIZE = 240; // size when we have to load the full image and resize it
var MAX_CONCURRENT_REQ = 2;
var requestsInProgress = 0;
var requestsQueued = [];

var imageInfo = {};

// Get a thumbnail from EXIF data
function getThumbFromFullImage(url, callback) {
  if (url.substr(-4).toLowerCase()==".mp4" || url.substr(-5).toLowerCase()==".mts" || url.substr(-4).toLowerCase()==".mov") {
    var img = document.createElement('video');
  } else {
    var img = document.createElement('img');
  }

  img.onload = function () {
    var w = this.videoWidth || img.width;
    var h = this.videoHeight || img.height;
    var oc = document.createElement('canvas'),
        octx = oc.getContext('2d');
    if (img.width > img.height) {
      oc.width = THUMB_SIZE;
      oc.height = THUMB_SIZE * h / w;
    } else {
      oc.width = THUMB_SIZE * w / h;
      oc.height = THUMB_SIZE;
    }
    octx.drawImage(img, 0, 0, oc.width, oc.height);
    callback(oc.toDataURL());
  };

  if (img.tagName != "VIDEO") {
  img.src = url;
  } else {
  img.addEventListener('loadeddata', img.onload);
  img.preload = 'metadata';
  img.controls = true;
  img.muted = true;
  img.src = url;
  }
}

// Get a thumbnail from EXIF data
function getEXIFThumb(url, arraybuffer, callback) {
  var arr = new Uint8Array(arraybuffer);
  if (arr[0]!=0xFF || arr[1]!=0xD8) {
    console.warn(url+" is not a valid JPEG");
    return callback(url);
  }
  var offs = 2;
  if (arr[offs]==0xFF && arr[offs+1]==0xE0) {
    offs += arr[offs+3] + 2;
  }
  if (arr[offs]!=0xFF || arr[offs+1]!=0xE1) {
    console.warn(url+" doesn't have EXIF tag at "+offs);
    return callback(url);
  }
  var len = (arr[offs+2]<<8)|arr[offs+3];
  if (len > arr.length) console.log("EXIF is "+len+" bytes long but we have only "+arr.length);
  if (arr[offs+4]!=0x45 || arr[offs+5]!=0x78 || arr[offs+6]!=0x69 || arr[offs+7]!=0x66) {
    console.warn(url+" doesn't have 'Exif' marker at "+offs);
    return callback(url);
  }
  // Move on to TIFF header
  offs += 10;
  var rd16, rd32;
  if (arr[offs]==0x49 && arr[offs+1]==0x49) {
    // Intel align
    rd16 = function(a) { return arr[a] | (arr[a+1]<<8); }
    rd32 = function(a) { return arr[a] | (arr[a+1]<<8) | (arr[a+2]<<16) | (arr[a+3]<<24); }
  } else if (arr[offs]==0x4D && arr[offs+1]==0x4D) {
    // Motorola align
    rd16 = function(a) { return arr[a+1] | (arr[a]<<8); }
    rd32 = function(a) { return arr[a+3] | (arr[a+2]<<8) | (arr[a+1]<<16) | (arr[a]<<24); }
  } else {
    console.warn(url+" unknown byte alignment "+arr[offs]+","+arr[offs+1]);
    return callback(url);
  }
  if (rd16(offs+2) != 0x002A) {
    console.warn(url+" expecting TAG mark");
    return callback(url);
  }
  // move on to IFD - Image file directory
  offs+=rd32(offs+4);
  // get tags
  var tags = rd16(offs);
  if (tags>100) {
    console.warn(url+" too many EXIF tags!");
    return callback(url);
  }
  offs += 2;
  // iterate over tags
  var thumbOrientation;
  for (var i=0;i<tags;i++) {
    var tag = rd16(offs+i*12);
    //console.log(tag.toString(16));
    if (tag==0x0112) { // JPEG orientation
      thumbOrientation = rd32(offs+i*12+8);
    }
 }
  // skip to next IFD
  offs = rd32(offs + tags*12);
  if (offs==0) {
    console.warn(url+" no second IFD.");
    return callback(url);
  }
  offs += 12;
  var tags = rd16(offs);
  if (tags>300) {
    console.warn(url+" too many EXIF tags ("+tags+") in second IFD!");
    return callback(url);
  }
  offs += 2;
  // iterate over tags
  var thumbOffset, thumbLen;
  for (var i=0;i<tags;i++) {
    var tag = rd16(offs+i*12);
    //console.log(tag.toString(16));
    if (tag==0x0201) thumbOffset = rd32(offs + i*12 + 8)+12; // ?
    if (tag==0x0202) thumbLen = rd32(offs + i*12 + 8);
  }
  if (thumbOffset && thumbLen) {
    //console.log("Thumb at",thumbOffset,"size",thumbLen,"tag",arr[thumbOffset].toString(16),arr[thumbOffset+1].toString(16));
    var data = arr.subarray(thumbOffset, thumbOffset+thumbLen);
    var blob = new Blob( [ data ], { type: "image/jpeg" } );
    var urlCreator = window.URL || window.webkitURL;
    var imageURL = urlCreator.createObjectURL( blob );
    var rotation = 0;
    if (thumbOrientation==6) rotation = 90;
    callback(imageURL, rotation);
  } else {
    /* No thumbnail */
    callback(url);
  }
}

function getImageThumbnail(url, finishedCb, thumbCb) {
  //console.log("Loading "+url);
  var xhr = new XMLHttpRequest;
  xhr.open('GET', url, true);
  xhr.responseType = "arraybuffer";
  xhr.setRequestHeader('Range', 'bytes=0-60000');
  xhr.onload = function (oEvent) {
    getEXIFThumb(url, xhr.response, function(url, rotation) {
      thumbCb(url, rotation);
      finishedCb();
    });
  };
  xhr.send(null);
}

function getImageThumbnailThrottled(url, cb, passURL) {
  if (requestsInProgress < MAX_CONCURRENT_REQ) {
   requestsInProgress++;

   function finishedCb() {
     requestsInProgress--;
     if (requestsQueued.length) {
       var r = requestsQueued.shift();
       getImageThumbnailThrottled(r.url, r.cb, r.passURL);
     }
   }

   if (passURL) {
     getThumbFromFullImage(url, function(url) {
       cb(url);
       finishedCb();
     });
   } else {
     getImageThumbnail(url, finishedCb, cb);
   }
  } else {
    //console.log("Delayed "+url);
    requestsQueued.push({url:url,cb:cb,passURL:passURL});
  }
}

function addDeferredThumb(thumbs, href) {
  var niceName;
  if (href.lastIndexOf("/")>=0)
    niceName = href.substr(href.lastIndexOf("/")+1);
  else
    niceName = href;

  function thumbLoaded(url, rotate) {
    imageInfo[href].thumb = url;
    im.innerHTML =
      '<div class="thumbimage" style="background-image:url('+url+');transform:rotate('+rotate+'deg)"></div>'+
      '<div class="caption">'+decodeURIComponent(niceName)+'</div>';
  }

  var im = document.createElement("DIV");
  im.innerHTML = '<div class="caption">'+decodeURIComponent(niceName)+'</div><div class="thumbicon">&#8987;</div>';
  im.className = "thumb";
  im.setAttribute("href", href);
  im.onclick = onThumbClicked;
  im = thumbs.appendChild(im);
  getImageThumbnailThrottled(href, function(url,rotate) {
    if (url == href) {
      // We use getImageThumbnailThrottled so we can make sure
      // that full images get loaded AFTER all the thumbnails
      getImageThumbnailThrottled(url, thumbLoaded, true);
    } else {
      thumbLoaded(url, rotate);
    }
  });
}

function addFolder(thumbs, href) {
  var niceName = href.substr(0,href.length-1);
  if (niceName.lastIndexOf("/")>=0)
    niceName = niceName.substr(niceName.lastIndexOf("/")+1);
  if (href.length < baseURL.length) niceName = "[BACK]";

  var a = document.createElement("A");
  a.href = window.location.pathname+"?"+href;
  a.innerHTML = '<div class="thumb folder"><div class="caption">'+decodeURIComponent(niceName)+'</div><div class="thumbicon">&#128193;</div></div>';
  thumbs.appendChild(a);
}
