ThinSlides
===========

https://github.com/dmahurin/ThinSlides

A single-file media slide show.
* Uses web server folder index for very lightweight server installation (inspired by ThinGallery)
* Provides full page media slide show, with key and swipe navigation between slides
* Finds and uses associated audio file for images (picture.jpg.mp3), for a narrated slide show experience.
* Lazy recursive folder traversal to show all media in selected folder

ThinSlides also incorporates the gallery code from ThinGallery. ThinGallery fetches 64K of image and uses EXIF thumbnail if it exists.

(See: https://github.com/gfwilliams/ThinGallery )

Some additions to ThinGallery code:
* lazy loading of images
* support for video files
* support for audio files

Setup
-----

* Run make to generate slides.html
* Put `slides.html` in the folder with your images/media
* Optionally copy index.php. This provides index for slides.html or passes slides.html contents
* Open slides.html (or path with slides.html if index.php is installed)

Usage
-----

* Press ESC to start slide show or return to gallery/index.
* Click on an image to start slide show at that image
* Use arrows or space to navigate and play.
* You may also use swipe or mouse click to navigate

