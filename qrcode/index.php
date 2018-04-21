<?php
require dirname( __DIR__ ) . '/vendor/autoload.php';
use chillerlan\QRCode\QRCode;
$data = $_GET['data'] ?? '';
?><!DOCTYPE html>
<html>

<head>
	<meta charset="UTF-8" />
	<title>QR Code</title>
</head>
<body>
	<h1>QR Code Generator</h1>

	<?php if ( $data ) : ?>
		<img src="<?= (new QRCode)->render($data) ?>" />
	<?php endif; ?>

	<form method="get">
		<input type="text" name="data" value="<?= htmlspecialchars( $data ) ?>" />
		<input type="submit" value="Generate">
	</form>
</body>
</html>
