<?php
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
// strip off index.php, and ignore other file requests
if (!preg_match('/(.*\/)(index\.php)?$/', $path, $matches)) {
	return false;
}
$path = $matches[1];

// redirect to slides.html for root queries not from JavaScript/XMLHttpRequest
if ( (!isset($_SERVER['QUERY_STRING'])) && $_SERVER['REQUEST_URI'] == '/' && (!(isset($_SERVER['HTTP_X_REQUESTED_WITH']) && $_SERVER['HTTP_X_REQUESTED_WITH'] == 'XMLHttpRequest')) && file_exists('./slides.html')){
	header('Location: slides.html');
	die();
}

$qpath = '';
if(isset($_SERVER['QUERY_STRING']) && $_SERVER['QUERY_STRING'] != '/') { $qpath = $_SERVER['QUERY_STRING']; }
$dir = substr($_SERVER["DOCUMENT_ROOT"] . urldecode($path . $qpath), 0, -1);
$files = scandir($dir);

if(file_exists("$dir/index.html")) {
	$file = file_get_contents("$dir/index.html");
	echo $file;
	return true;
}

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
