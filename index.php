<?php
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
// strip off index.php, and ignore other file requests
if (!preg_match('/(.*\/)(index\.php)?$/', $path, $matches)) {
	return false;
}
$path = $matches[1];
// queries ending in '/' or XMLHTTPRequests will give index, otherwise, give gallery/slides
if ((!(isset($_SERVER['QUERY_STRING']) && substr($_SERVER['QUERY_STRING'],-1) == '/')) && (!(isset($_SERVER['HTTP_X_REQUESTED_WITH']) && $_SERVER['HTTP_X_REQUESTED_WITH'] == 'XMLHttpRequest'))) {
	if ( $_SERVER['QUERY_STRING'] == '' && !preg_match('/\?$/', $_SERVER['REQUEST_URI'])) {
		header('Location: ?');
		die();
	}
	$file = file_get_contents('./slides.html');
	echo $file;
	return true;
}

$qpath = '';
if(isset($_SERVER['QUERY_STRING']) && $_SERVER['QUERY_STRING'] != '/') { $qpath = $_SERVER['QUERY_STRING']; }
$dir = substr($_SERVER["DOCUMENT_ROOT"] . urldecode($path . $qpath), 0, -1);
$files = scandir($dir);

header("Content-type: text/html");

echo "<html><body>\n";

function getFolderImage($dir, $folder) {
	if(file_exists("$dir/$folder/.folder.jpg")) return "$folder/.folder.jpg";
	elseif(file_exists("$dir/$folder/folder.jpg")) return "$folder/folder.jpg";
	elseif(file_exists("$dir/$folder/.cover.jpg")) return "$folder/.cover.jpg";
	elseif(file_exists("$dir/$folder/cover.jpg")) return "$folder/cover.jpg";
	return null;
}

foreach ($files as $file) {
	if ($file === ".") continue;

	if(is_dir("$dir/$file")) {
		$img = getFolderImage($dir, $file);
		if(!is_null($img))
			echo "<a href=\"$qpath$file/\"><img src=\"$qpath$img\" style=\"width:32; height:32\"/>$file/</a><br>\n";
		else
			echo "<a href=\"$qpath$file/\">$file/</a><br>\n";
	} else {
		echo "<a href=\"$qpath$file\">$file</a><br>\n";
	}
}

echo "</body></html>\n";
?>
