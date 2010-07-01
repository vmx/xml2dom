/*
  This software is licensed under the MIT License
  Copyright (c) 2010 Volker Mische (http://vmx.cx/)

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
*/

// NOTE vmx: No DOCTYPE support
var xml2dom = function(xmlString) {
    // Comment in if you want to use jsdom
    var doc = new dom.Document();
    // Comment in if you want to use native DON
    //var doc = document.implementation.createDocument('', '', null); 

    var xmlList = ShallowParse(xmlString);
    //console.log('xmlList: ' + xmlList);

    var stack = [doc];
    // the parsed DOM node
    var node;

    for each (elem in xmlList) {
        //console.log('elem: ' + elem);
        // tag
        if (elem.charAt(0) == '<') {
            elem = elem.slice(1,-1);
            
            // comment
            if (elem.substr(0, 3)=='!--') {
                //console.log('comment: ' + elem.slice(3,-2));
                node = doc.createComment(elem.slice(3,-2));
            }
            // CDATA
            else if (elem.substr(0, 8)=='![CDATA[') {
                //console.log('CDATA: ' + elem.slice(8,-2));
                node = doc.createCDATASection(elem.slice(8,-2));
            }
            // processing instruction
            else if (elem.charAt(0)=='?') {
                //console.log('processing instruction: ' + elem.slice(1,-1));
                var splits = elem.slice(1,-1).match(/([^\s+]*)\s+(.*)/);
                splits.shift();
                var target = splits[0];
                var data = splits[1];
                node = doc.createProcessingInstruction(target, data);
            }
            // closing tag
            //else if (elem.charAt(0)=='/' || elem.charAt(elem.length-1)=='/') {
            else if (elem.charAt(0)=='/') {
                //console.log('closing tag: ' + elem);
                node = stack.pop();
            }
            // opening tag
            else {
                //console.log('opening tag: ' + elem);

                // Split tag into name and attribute names, values:
                // e.g. ['a', 'href', '"http://example.com/"', 'id', '"foo"']
                // The regexp is that difficult as values may contain spaces
                var tag = elem.match(/[\w:]+|"[^\"]+"/g);
                //console.log('tag: ' + tag);
                node = doc.createElement(tag[0]);
                
                // tag has attributes
                if (tag.length>1) {
                    for (var i=1; i<tag.length; i+=2) {
                        var name = tag[i];
                        var value = tag[i+1].slice(1,-1);
                        node.setAttribute(name, value);
                    }
                }
                
                // if it is not a self-closing tag
                if (elem.charAt(elem.length-1)!='/') {
                    stack.push(node);
                    // Don't append it to the previous node as in all other cases
                    continue;
                }
            }
        }
        // text node
        else {
            //console.log('text: ' + elem);

            // decode XML entities
            elem = elem
                .replace(/&quot;/g, '"')
                .replace(/&amp;/g, '&')
                .replace(/&apos;/g, "'")
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&#x([a-zA-Z\d]+);/g, function(str, p1){return String.fromCharCode('0x00' + p1);})
                .replace(/&#(\d+);/g, function(str, p1){return String.fromCharCode(p1);});
            node = doc.createTextNode(elem);
        }

        // Normally attach nodes to parent node. The only exception is when
        // a new tag is opened (then push on stack)
        stack[stack.length - 1].appendChild(node);
    }
    return stack[0];

    function ShallowParse(XMLdoc) {
        /*
          Based on Robert D. Cameron's REX/Javascript 1.0.
          It contained a bug with CDATA. I found it when I tried the Python
          port of it.

          Original copyright notice follows:

          REX/Javascript 1.0 
          Robert D. Cameron "REX: XML Shallow Parsing with Regular Expressions",
          Technical Report TR 1998-17, School of Computing Science, Simon Fraser 
          University, November, 1998.
          Copyright (c) 1998, Robert D. Cameron. 
          The following code may be freely used and distributed provided that
          this copyright and citation notice remains intact and that modifications
          or additions are clearly identified.
        */

        TextSE = "[^<]+";
        UntilHyphen = "[^-]*-";
        Until2Hyphens = UntilHyphen + "([^-]" + UntilHyphen + ")*-";
        CommentCE = Until2Hyphens + ">?";
        // MODIFIED: added \\
        UntilRSBs = "[^\\]]*]([^\\]]+])*]+";
        // MODIFIED: added \\
        CDATA_CE = UntilRSBs + "([^\\]>]" + UntilRSBs + ")*>";
        S = "[ \\n\\t\\r]+";
        NameStrt = "[A-Za-z_:]|[^\\x00-\\x7F]";
        NameChar = "[A-Za-z0-9_:.-]|[^\\x00-\\x7F]";
        Name = "(" + NameStrt + ")(" + NameChar + ")*";
        QuoteSE = '"[^"]' + "*" + '"' + "|'[^']*'";
        DT_IdentSE = S + Name + "(" + S + "(" + Name + "|" + QuoteSE + "))*";
        // MODIFIED: added \\
        MarkupDeclCE = "([^\\]\"'><]+|" + QuoteSE + ")*>";
        S1 = "[\\n\\r\\t ]";
        UntilQMs = "[^?]*\\?+";
        PI_Tail = "\\?>|" + S1 + UntilQMs + "([^>?]" + UntilQMs + ")*>";
        DT_ItemSE = "<(!(--" + Until2Hyphens + ">|[^-]" + MarkupDeclCE + ")|\\?" + Name + "(" + PI_Tail + "))|%" + Name + ";|" + S;
        DocTypeCE = DT_IdentSE + "(" + S + ")?(\\[(" + DT_ItemSE + ")*](" + S + ")?)?>?";
        DeclCE = "--(" + CommentCE + ")?|\\[CDATA\\[(" + CDATA_CE + ")?|DOCTYPE(" + DocTypeCE + ")?";
        PI_CE = Name + "(" + PI_Tail + ")?";
        EndTagCE = Name + "(" + S + ")?>?";
        AttValSE = '"[^<"]' + "*" + '"' + "|'[^<']*'";
        ElemTagCE = Name + "(" + S + Name + "(" + S + ")?=(" + S + ")?(" + AttValSE + "))*(" + S + ")?/?>?";
        MarkupSPE = "<(!(" + DeclCE + ")?|\\?(" + PI_CE + ")?|/(" + EndTagCE + ")?|(" + ElemTagCE + ")?)";
        XML_SPE = TextSE + "|" + MarkupSPE;

        return XMLdoc.match(new RegExp(XML_SPE, "g"));
    }
};
