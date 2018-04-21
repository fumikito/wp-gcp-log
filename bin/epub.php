<?php

namespace Hametuha\Rest;

require dirname( __DIR__ ) . '/vendor/autoload.php';

use Hametuha\HamePub\Factory;

define( 'BASE_DIR', dirname( __DIR__ ) . '/epub' );
try {

	echo "Start factory.\n";
	$factory = Factory::init( basename( BASE_DIR ), dirname( BASE_DIR ) );

	echo "Scan HTML and register them all.\n";
	$toc = [];
	foreach ( scandir( BASE_DIR . '/OEBPS/documents' ) as $file ) {
		if ( preg_match( '#^\.#', $file ) ) {
			continue;
		}
		switch ( $file ) {
			case '00_toc.xhtml':
				$property = [ 'nav' ];
				break;
			default:
				$property = [];
				break;
		}
		$id = 'documents-' . preg_replace( '#[._]#', '-', $file );

		$factory->opf->addItem( "documents/{$file}", $id, $property );
		$factory->opf->addIdref( $id, 'yes' );
		$html = file_get_contents( BASE_DIR . '/OEBPS/documents/' . $file );
		if ( preg_match( '#<title>([^<]+)</title>#u', $html, $matches ) ) {
			if ( '00_title.html' === $file ) {
				$title = '扉';
			} else {
				$title = $matches[1];
			}
			$toc[ 'OEBPS/documents/' . $file ] = $title;
		}
	}

	echo "Create TOC.\n";
	foreach ( $toc as $id => $label ) {
		$factory->toc->addChild( $label, $id );
	}

	echo "Register all images and CSS.\n";
	$factory->opf->addItem( 'css/epub.css', '' );
	foreach ( scandir( BASE_DIR . '/OEBPS/images' ) as $file ) {
		if ( preg_match( '#^\.#u', $file ) ) {
			continue;
		}
		if ( '00_cover.png' === $file ) {
			$factory->opf->addItem( 'images/' . $file, 'cover', [ 'cover-image' ] );
			$factory->opf->addMeta( 'meta', '', [
				'name'    => 'cover',
				'content' => 'images/' . $file,
			] );
		} else {
			$factory->opf->addItem( 'images/' . $file, '' );
		}
	}

	echo "Setup opf.\n";
	$factory->opf->setIdentifier( 'https://github.com/fumikito/wp-gcp-log' );
	$factory->opf->setLang( 'ja' );
	$factory->opf->setTitle( 'WordPressではじめるGoogle Cloud Platform本格入門', 'main-title' );
	$factory->opf->setTitle( 'WordPress on Google Cloud Platform', 'sub-title', 'subtitle', 2 );
	$factory->opf->setModifiedDate( time() );
	$factory->opf->direction = 'ltr';
	$factory->opf->putXML();
	$factory->container->putXML();

	echo "Compile ePub.\n";
	$factory->compile( './wp-gcp-log.epub' );

} catch ( \Exception $e ) {
	die( $e->getMessage() );
}
