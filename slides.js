var loaded = [];
var folders = [];
var current = 0;
var slides = [];
var slide_audio = [];
var path_image = [];
var folder_image = [];
var gallery_body;
var gallery_top = 0;
var index_dir = ('/' == window.location.pathname.slice(-1) || 'index.html' == window.location.pathname.substr(window.location.pathname.lastIndexOf("/")+1)) ? 'files/' : '';

function loadNextIndex(cb) {
	if(folders.length == 0) return;
	var url = index_dir + folders.shift();

	url = url.replace(/\?.*$/, '');
	if(loaded[url] !== undefined) { return; }

	loaded[url] = 1;
	fetch(url == '' ? './' : url,
		{headers: {'X-Requested-With': 'XMLHttpRequest'}}).then( response => {
		response.text().then(text => {
			text = (new window.DOMParser()).parseFromString(text, "text/html");
		var need_decrypt = indexLoaded(url, text);
			if(cb !== undefined) {
				if(need_decrypt) {
					get_key_password(document.body).then(r => {cb(); });
				} else {
					cb();
				}
			}});
		});
}

function indexLoaded(dirURL, responseXML) {
	var basePath = window.location.pathname.match(/.*\//)[0];

	var newdirs = [];
	var files = [];
	var elements = responseXML.getElementsByTagName("a");
	for (var i=0;i<elements.length;i++) {
		if(elements[i].origin != window.location.origin) continue;
		var url = elements[i].getAttribute("href");
		if(url.slice(0,2) == './') {
			url = url.slice(2);
		}
		// change url to relative and skip non children
		if (url[0] == '/') {
			if(url.indexOf(basePath) === 0) { url = url.slice(basePath.length); } else { continue; }
			if (url.indexOf(dirURL) !== 0 ) { continue; }
		} else if (url.length < 2 || url.lastIndexOf('/', url.length - 2) < 0) {
			url = dirURL + url;
		}

		var name = url.substring(url.lastIndexOf('/') + 1);
		if(name == 'cover.jpg' || name == '.cover.jpg' || name == 'folder.jpg' || name == '.folder.jpg') {
			path_image[dirURL] = url;
			continue;
		}

		if(url.charAt(dirURL.length) == '.') { continue; }
		if(url.charAt(dirURL.length) == '@') { continue; }
		var img = elements[i].getElementsByTagName('img');
		if ( url[url.length-1]=="/") {
			if(img.length > 0) {
				img = img[0].src;
				folder_image[url] = img;
			}
			newdirs.push(url);
		} else {
			files.push(url);
		}
	}
	folders = newdirs.concat(folders);
	return addFiles(files);
}

function showIndex(url) {
	var basePath = window.location.pathname.match(/.*\//)[0];
	var body = document.createElement("body");
	var h1 = document.createElement("h1");
	h1.appendChild(document.createTextNode('Index of ' + basePath + decodeURIComponent(url)));
	body.appendChild(h1);
	var parent = document.createElement('a');
	parent.innerText = 'Parent';
	parent.href = window.location.search.replace(/[^\/\?]+\/$/, '');
	body.appendChild(parent);
	body.appendChild(document.createElement('br'));
	for (var i in folders) {
		var href = folders[i];
		var link = document.createElement('a');

		link.href = '?' + href;
		link.innerText = decodeURIComponent(href.split('/').slice(-2));
		body.appendChild(link);
		body.appendChild(document.createElement('br'));
	}

	var h3 = document.createElement("h3");
	h3.appendChild(document.createTextNode('Media'));
	body.appendChild(h3);
	body.addEventListener("keydown", function(e) {
		if (e.keyCode==13 || e.keyCode == 32 || e.keyCode == 27) {
			showSlides();
		}
	});
	for (var i in slides) {
		var file = decodeURIComponent(slides[i].split('/').pop());
		var link = document.createElement('a');
		link.href = 'javascript:void(0)';
		(function() {
			var this_i = +i;
			link.onclick = function() { current = this_i; showSlides(); return false; }
		})();
		link.innerText = file;
		body.appendChild(link);
		body.appendChild(document.createElement('br'));
	}
	document.body = body;
}

function showGallery(gallery) {
	if(gallery_body !== undefined) {
		document.body = gallery_body;
		document.body.scrollTop = gallery_top;
		return;
	}
	var body = document.createElement("body");
	body.className = 'thumbs';
	var thumbs = document.createElement("div");
	body.appendChild(thumbs);

	if( window.location.search.length > 1) {
		var parent = window.location.search.slice(1).replace(/[^\/]+\/?$/, '');
		addFolder(thumbs, parent, '[BACK]');
	}
	for (var i in folders) {
		addFolder(thumbs, folders[i].slice(index_dir.length), undefined, folder_image[folders[i]]);
	}
	for (var i in slides) {
		var href = slides[i];
		var hrefl = href.toLowerCase();
		imageInfo[href] = { thumb : undefined, index: +i };
		if (hrefl.substr(-4)==".jpg" || hrefl.substr(-5)==".jpeg" || hrefl.substr(-4)==".png" || hrefl.substr(-8)==".jpg.aes" || hrefl.substr(-8)==".aes.jpg" || hrefl.substr(-12)==".jpg.aes.bin") {
			addDeferredThumb(thumbs, href, '&#x1f5bc;');
		} else if (hrefl.substr(-4)==".mp4" || hrefl.substr(-4)==".mts" || hrefl.substr(-4)==".mov") {
			addDeferredThumb(thumbs, href, '&#x1f39e;');
		} else if (hrefl.substr(-4)==".mp3" || hrefl.substr(-5)==".flac" ) {
			imageInfo[href].image = path_image[href] || path_image[href.slice(0, href.lastIndexOf('/') + 1)];
			addDeferredThumb(thumbs, href, '&#x1f508;');
		} else {
			addDeferredThumb(thumbs, href);
		}
	}

	body.addEventListener("keydown", function(e) {
		if (e.keyCode==13 || e.keyCode == 32 || e.keyCode == 27) {
			showSlides();
		}
	});
	addEventListener('resize', getImageThumbnailVisibleCheckAll, false);
	addEventListener('scroll', getImageThumbnailVisibleCheckAll, false);
	gallery_body = body;
	document.body = body;
	getImageThumbnailVisibleCheckAll();
}
function onThumbClicked(e) {
	e.preventDefault();
	var url = e.currentTarget.getAttribute("href");
	current = imageInfo[url].index;
	gallery_top = document.body.scrollTop;
	showSlides();
}

function addFiles(files) {
	var need_decrypt = false;

	var basefile = [];
	var aud = new Audio();
	for (var i in files) {
		var file = files[i];
		basefile[file] = '';
	}
	for (var i in files) {
		var file = files[i];
		var filebase = file.substring(0, file.lastIndexOf('.'));
		if(filebase != '' && basefile[filebase] === '' ) {
			basefile[file] = filebase;
		}
	}
	for (var i in files) {
		var file = files[i];
		var exts = (file.indexOf('.') >= 0 ? file.slice(file.indexOf('.')+1) : '').toLowerCase().split('.');
		if ( exts[exts.length -1] == 'bin') { exts.pop(); }
		if ( exts[exts.length -1] == 'aes') { need_decrypt = true; exts.pop(); }
		var ext = exts[exts.length-1];
		if ( ext == 'jpg' || ext == 'jpeg' || ext == 'png') {
			// .mp3.jpg
			if(basefile[file] != '') {
				path_image[basefile[file]] = file;
			} else {
				slides.push(file);
			}
		} else if ( ext == 'mp4' || ext == 'mts' || ext == 'mov' ) {
			slides.push(file);
		} else if ( ext == 'flac' || ext == 'wav' || ext == 'mp3' || ext == 'm4a' ) {
			if(ext == 'flac' && aud.canPlayType('audio/ogg; codecs=flac') == '') continue;
			if(ext == 'mp3' && aud.canPlayType('audio/mpeg') == '') continue;

			// .jpg.mp3
			if(basefile[file] != '') {
				slide_audio[basefile[file]] = file;
			} else {
				slide_audio[file] = file;
				slides.push(file);
			}
		}
	}
	return need_decrypt;
}

function get_key_password(body) {
	var key = localStorage.getItem("key");
	var password = sessionStorage.getItem("password");

	if(key != null && password != null) {
		return new Promise((resolve, reject) => {
			resolve();
		});
	}

	function add_input_password(form, id, label_text) {
		var label = document.createElement("label");
		label.id = id + '-label';
		label.innerText = label_text;
		form.appendChild(label);
		var input = document.createElement("input");
		input.setAttribute("type", "password");
		input.id = id;
		form.appendChild(input);
		return input;
	}

	var overlay = document.createElement("div");
	overlay.classList.add("overlay");

	var form = document.createElement("form");

	var key_div = document.createElement("div");
	var key_label = document.createElement("label");
	key_label.innerText = 'Key';
	key_div.appendChild(key_label);
	var key_input = document.createElement("textarea");
	key_input.id = 'key';
	key_div.appendChild(key_input);
	key_div.style.display = key == null ? 'block' : 'none';
	form.appendChild(key_div);

	var key_change_button = document.createElement("button");
	key_change_button.style.display = key == null ? 'none' : 'block';
	key_change_button.setAttribute("type", "button");
	key_change_button.innerText = "Re-enter Key";
	key_change_button.addEventListener('click',function(e) {
		key_div.style.display = 'block';
		key_change_button.style.display = 'none';
		change_password_button.style.display = 'none';
	});
	var password_input = add_input_password(form, 'password', 'Password');
	var password_button = document.createElement("button");
	password_button.innerText = 'Enter Password';
	password_button.setAttribute("type", "button");
	var change_password_div = document.createElement("div");
	change_password_div.style.display = 'none';
	var new_password = add_input_password(change_password_div, 'new_password', 'New Password');
	var new_password_confirm = add_input_password(change_password_div, 'new_password_confirm', 'New Password (confirm)');
	form.appendChild(change_password_div);
	form.appendChild(password_button);
	form.appendChild(key_change_button);
	var change_password_button = document.createElement("button");
	change_password_button.setAttribute("type", "button");
	change_password_button.innerText = 'Change Password';

	change_password_button.addEventListener('click',function(e) {
		key_change_button.style.display = 'none';
		change_password_button.style.display = 'none';
		document.getElementById('password-label').innerText = 'Current Password';
		password_button.innerText = 'Enter/Change Password';
		change_password_div.style.display = 'block';
	});

	form.appendChild(change_password_button);

	overlay.appendChild(form);
	body.appendChild(overlay);

	return new Promise((resolve, reject) => {
		password_button.addEventListener('click',function(e) {
			if(password_input.value === '') { return; }

			if(new_password.value == '') {
				if(key_input.value !== '') {
					localStorage.setItem("key", key_input.value);
				}
				sessionStorage.setItem("password", password_input.value);
				overlay.remove();
				resolve();
			} else {
				if(new_password_confirm.value != new_password.value) {
					alert('passwords do not match');
					return;
				}
				var options = { "password": password_input.value, "new_password": new_password.value, "key": key != null ? key : undefined };
				oencrypt.gen_key(options).catch(e => {
					console.error(e.stack);
					alert("key change failed " + e);
				}).then(key => {
					if(key === undefined) { alert('could not store key'); return; }
					localStorage.setItem("key", oencrypt.buffer_to_base64(key));
					sessionStorage.setItem('password', options.new_password);
					overlay.remove();
					resolve();
				});
			}
		}, {once: true});
	});
}

function showSlides() {
	if(showSlides.instance === undefined) {
		showSlides.instance = '';
		showSlides.instance = new showSlides();
		return;
	} else if(showSlides.instance) {
		document.body = showSlides.instance.body;
		showSlides.instance.showSlide({});
		return;
	}

	var body = document.createElement("body");
	body.style['margin'] = 0; body.style['height'] = '100%';
	var img = document.createElement("img");
	img.className = 'fullscreen';
	var video = document.createElement("video");
	video.className = 'fullscreen';
	video.style.visibility = 'hidden';

	body.appendChild(img);
	body.appendChild(video);
	var text = document.createElement('div');
	text.style.position = 'fixed';
	text.style.top = '0%';
	body.appendChild(text);
	var aud = document.createElement('audio');
	aud.style.position = 'fixed';
	aud.style.bottom = '0%';
	aud.controls = false;

	body.appendChild(aud);

	function showSlide(p) {
		var next = current;
		var media = (slide_audio[slides[current]] === '') ? video : aud;
		// if playing and no audio, go to next.if audio ended or error go to next. if paused and not at start go to next.
		if(p.next && current < slides.length && (p.play != true || slide_audio[slides[current]] === undefined || media.ended || media.error != null || ( media.currentTime != 0 && ! media.paused ) ) ) { next = current + 1; }
		if(next >= slides.length) {
			loadNextIndex(function() {
				showSlide(p);
			});
			return;
		}
		video.pause();
		aud.pause();
		text.text = slides[current];
		// just play audio if no slide change
		if(p.play && next == current) {
			if(video.style.visibility == 'visible') {
				video.pause();
				video.currentTime = 0;
				video.play();
			} else {
				aud.load();
				aud.play();
			}
			return;
		}
		current = next;
		var slide = slides[current];
		var image = path_image[slide] || path_image[slide.slice(0, slide.lastIndexOf('/') + 1)];
		var slidename = decodeURIComponent(slide.substr(slide.lastIndexOf('/')+1));
		var ext = (slide.indexOf('.') >= 0 ? slide.slice(slide.lastIndexOf('.')+1) : '').toLowerCase();
		if(ext == 'mp4' || ext == 'mov' || ext == 'mts') {
			aud.controls = false;
			img.style.visibility = 'hidden';
			video.style.visibility = 'visible';
			video.src = slide;
			text.innerText = slidename;
			if(p.play) video.play();
			return;
		} else if(image === undefined && (ext == 'mp3' || ext == 'm4a' || ext == 'wav' || ext == 'wav' || ext == 'flac')) {
			img.style.visibility = 'hidden';
			video.style.visibility = 'hidden';
			aud.src = slide;
			aud.controls = true;
			text.innerText = slidename;
			if(p.play) aud.play();
			return;
		}

		video.style.visibility = 'hidden';
		aud.controls = false;
		img.onload = function() {
			img.style.visibility = 'visible';
			text.innerText = slidename;
			if(slide_audio[slide] !== undefined) {
				aud.src = slide_audio[slide];
				aud.controls = image !== undefined || (aud.duration > 30);
				if(p.play) aud.play();
			}
			URL.revokeObjectURL(img.src);
		};
		if(slide.substr(-8)==".jpg.aes" || slide.substr(-8)==".aes.jpg" || slide.substr(-12)==".jpg.aes.bin") {
			var password = sessionStorage.getItem("password");
			var key = localStorage.getItem("key");

			if(password !== undefined || password !== undefined) {
				var options = { 'password': password , 'key': key, 'cipher': 'aes-256-ctr' };
				oencrypt.fetch(slide, undefined, options)
				.catch(e => { console.error("fetch error: " + e); })
				.then(res => res.arrayBuffer())
				.then(data => {
					data = new Blob( [ data ], { type: "image/jpeg" } );
					var urlCreator = window.URL || window.webkitURL;
					var imageUrl = urlCreator.createObjectURL( data );
					img.src = imageUrl;
				});
			}
		} else {
			img.src = image || slide;
		}
	}
	this.showSlide = showSlide;
	showSlide({});

	this.body = body;
	document.body = body;
	body.addEventListener("keydown", function (e) {
		// stop/escape
		if (e.keyCode==27) { if( !aud.paused ) { aud.pause(); } else { showGallery(); } }
		if (e.keyCode==32) { showSlide({play: true, next: true}); }
		if (e.keyCode==13) { showSlide({play: true}); }
		if (e.keyCode==39 || e.keyCode==40) { showSlide({next: true}); }
		if (e.keyCode==8 || e.keyCode == 37 || e.keyCode == 40) {
			if(current > 0) { current--; }
			showSlide({});
		}
	});

	var touchx;
	var touchy;

	function touchstart_handler(e) {
		if(e.touches !== undefined) {
			e = e.touches[0];
			body.removeEventListener('mousedown', touchstart_handler);
			body.removeEventListener('mouseup', touchend_handler);
		}
		touchx = e.clientX;
		touchy = e.clientY;
		return false;
	}

	function touchend_handler(e) {
		if(e.changedTouches !== undefined) { e = e.changedTouches[0]; }
		var touchxdelta = e.clientX - touchx;
		var touchydelta = e.clientY - touchy;
		touchx = undefined;
		touchy = undefined;

		if(touchxdelta <= -10) {
			showSlide({next: true});
		} else if(touchxdelta < 10) {
			showSlide({play: true, next: true});
		} else {
			aud.pause();
			if(current <= 0) return;
			current--;
			showSlide({});
		}
	}

	document.body.ondragstart= function() {return false;}
	document.body.ondrop=function() {return false;}
	document.body.addEventListener("touchstart", touchstart_handler);
	document.body.addEventListener("touchend", touchend_handler);
	document.body.addEventListener("mousedown", touchstart_handler);
	document.body.addEventListener("mouseup", touchend_handler);
}
