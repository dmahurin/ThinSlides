<?php
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if (!preg_match('/\/$/', $path)) {
	return false;
}
if (!(isset($_SERVER['HTTP_X_REQUESTED_WITH']) && $_SERVER['HTTP_X_REQUESTED_WITH'] == 'XMLHttpRequest')) {
	if ( $_SERVER['QUERY_STRING'] == '' && !preg_match('/\?$/', $_SERVER['REQUEST_URI'])) {
		header('Location: ?');
		die();
	}
	$file = file_get_contents('./slides.html');
	echo $file;
	return true;
}

$dir = $_SERVER["DOCUMENT_ROOT"] . $path;
$files = scandir($dir);

header("Content-type: text/html");

echo "<html><body>\n";

function getDirImage($path, $dir) {
	if(file_exists("$path/$dir/.folder.jpg")) return "$dir/.folder.jpg";
	elseif(file_exists("$path/$dir/folder.jpg")) return "$dir/folder.jpg";
	elseif(file_exists("$path/$dir/.cover.jpg")) return "$dir/.cover.jpg";
	elseif(file_exists("$path/$dir/cover.jpg")) return "$dir/cover.jpg";
	return null;
}

foreach ($files as $file) {
	if ($file === ".") continue;

	if(is_dir("$dir/$file")) {
		$img = getDirImage($dir, $file);
		if(!is_null($img))
			echo "<a href=\"$file/\"><img src=\"$img\" style=\"width:32; height:32\"/>$file/</a><br>\n";
		else
			echo "<a href=\"$file/\">$file/</a><br>\n";
	} else {
		echo "<a href=\"$file\">$file</a><br>\n";
	}
}

echo "</body></html>\n";
?>
