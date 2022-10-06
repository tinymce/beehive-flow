# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Fixed
- Fixed an issue where the image dialog tried to calculate image dimensions for an empty image URL. #TINY-6611

## 5.6.2 - 2020-12-08

### Fixed
- Fixed a UI rendering regression observed when the document body is using `display: flex`. #TINY-6783

## 5.6.1 - 2020-11-25

### Fixed
- Fixed the `mceTableRowType` and `mceTableCellType` commands were not firing the `newCell` event. #TINY-6692
- Fixed the HTML5 `s` element was not recognized when editing or clearing text formatting. #TINY-6681
- Fixed an issue where copying and pasting table columns resulted in invalid HTML when using colgroups. #TINY-6684
- Fixed an issue where the toolbar would render with the wrong width for inline editors in some situations. #TINY-6683

## 5.6.0 - 2020-11-18

### Added
- Added new `BeforeOpenNotification` and `OpenNotification` events which allow internal notifications to be captured and modified before display. #TINY-6528
- Added support for the `block` and `unblock` methods on inline dialogs. #TINY-6487
- Added a new `TableModified` event which is fired whenever changes are made to a table. #TINY-6629
- Added a new `images_file_types` setting to determine which image file formats will be automatically processed into `img` tags on paste when using the `paste` plugin. #TINY-6306
- Introduced support for `images_file_types` setting in the image file uploader to determine which image file extensions are valid for upload. #TINY-6224
- Added new a `format_empty_lines` setting to control if empty lines are formatted in a ranged selection. #TINY-6483
- Added template support to the `autocompleter` for customizing the autocompleter items. #TINY-6505
- Introduced new user interface `enable`, `disable`, and `isDisabled` methods. #TINY-6397
- Added a new `closest` formatter API to get the closest matching selection format from a set of formats. #TINY-6479
- Added a new `emojiimages` emoticons database that uses the twemoji CDN by default. #TINY-6021
- Added a new `emoticons_database` setting to configure which emoji database to use. #TINY-6021

### Improved
- Added a new `name` field to the `style_formats` setting object to enable specifying a name for the format. #TINY-4239

### Changed
- Changed `readonly` mode to allow hyperlinks to be clickable. #TINY-6248

### Fixed
- Fixed the `change` event not firing after a successful image upload. #TINY-6586
- Fixed the type signature for the `entity_encoding` setting not accepting delimited lists. #TINY-6648
- Fixed layout issues when empty `tr` elements were incorrectly removed from tables. #TINY-4679
- Fixed image file extensions lost when uploading an image with an alternative extension, such as `.jfif`. #TINY-6622
- Fixed `DOMUtils.getParents` incorrectly including the shadow root in the array of elements returned. #TINY-6540
- Fixed an issue where the root document could be scrolled while an editor dialog was open inside a shadow root. #TINY-6363
- Fixed `getContent` with text format returning a new line when the editor is empty. #TINY-6281
- Fixed table column and row resizers not respecting the `data-mce-resize` attribute. #TINY-6600
- Fixed inserting a table via the `mceInsertTable` command incorrectly creating 2 undo levels. #TINY-6656
- Fixed nested tables with `colgroup` elements incorrectly always resizing the inner table. #TINY-6623
- Fixed the `visualchars` plugin causing the editor to steal focus when initialized. #TINY-6282
- Fixed `fullpage` plugin altering text content in `editor.getContent()`. #TINY-6541
- Fixed `fullscreen` plugin not working correctly with multiple editors and shadow DOM. #TINY-6280
- Fixed font size keywords such as `medium` not displaying correctly in font size menus. #TINY-6291
- Fixed an issue where some attributes in table cells were not copied over to new rows or columns. #TINY-6485
- Fixed incorrectly removing formatting on adjacent spaces when removing formatting on a ranged selection. #TINY-6268
- Fixed the `Cut` menu item not working in the latest version of Mozilla Firefox. #TINY-6615
- Fixed some incorrect types in the new TypeScript declaration file. #TINY-6413
- Fixed a regression where a fake offscreen selection element was incorrectly created for the editor root node. #TINY-6555
- Fixed an issue where menus would incorrectly collapse in small containers. #TINY-3321
- Fixed an issue where only one table column at a time could be converted to a header. #TINY-6326
- Fixed some minor memory leaks that prevented garbage collection for editor instances. #TINY-6570
- Fixed resizing a `responsive` table not working when using the column resize handles. #TINY-6601
- Fixed incorrectly calculating table `col` widths when resizing responsive tables. #TINY-6646
- Fixed an issue where spaces were not preserved in pre-blocks when getting text content. #TINY-6448
- Fixed a regression that caused the selection to be difficult to see in tables with backgrounds. #TINY-6495
- Fixed content pasted multiple times in the editor when using Microsoft Internet Explorer 11. Patch contributed by mattford. #GH-4905

### Security
- Fixed a moderate severity security issue where URLs in attributes weren't correctly sanitized. #TINY-6518