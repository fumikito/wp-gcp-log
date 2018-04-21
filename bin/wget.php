<?php

$bad_file = 'manuscripts/05_chapter.md';
$target   = 'images';
$counter = 1;

$content = file_get_contents( $bad_file );

$content = preg_replace_callback( '/!\[\]\((https:.*)\)/u', function( $matches ) use ( &$counter ) {
	$counter++;
	$new_name = sprintf( '05_%02d_image.png', $counter );
	$url = $matches[1];
	$path = '../images/' . $new_name;
	// Save image.
//	file_put_contents( "images/{$new_name}", file_get_contents( $url ) );
	return "![](../images/{$new_name})";
}, $content );

file_put_contents( $bad_file, $content );
