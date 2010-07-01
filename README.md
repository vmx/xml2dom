xml2dom
=======

Overview
--------

xml2dom is a pure JavaScript XML to DOM parser (non-validating). It
can be used client and server sided, either with the native DOM or the
[JSDOM](http://jsdom.org/) implementation.

As JSDOM supports only DOM1, at the time of writing, there's no real
namespace support, though namespaced XML can be parsed.


The serialization of the parser (run with native DOM in FF3.6.3) was
compared to the one produced by the native FF DOMParser.

Usage
-----

Just call the xml2dom function with the XML string you'd like to
parse:

    xml2dom('<some>xml</some>');

See xml2dom.html source for more information.

License
-------

The code is released under the MIT License.

Author
------

Volker Mische (http://vmx.cx/)
