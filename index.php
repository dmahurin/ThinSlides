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

foreach ($files as $file) {
	if ($file === ".") continue;
	if(is_dir($dir . $file))
		echo "<a href=\"$file/\">$file/</a><br>\n";
	else
		echo "<a href=\"$file\">$file</a><br>\n";
}

echo "</body></html>\n";
?>
