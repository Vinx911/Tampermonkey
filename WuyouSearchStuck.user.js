// ==UserScript==
// @name         解决无忧启动搜索结果中的链接打开卡住问题
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  自动删除无忧启动论坛搜索时链接中的highlight,防止网页卡住
// @author       VIIs
// @match
// @grant        none
// @require      http://cdn.bootcss.com/jquery/2.2.4/jquery.min.js
// @include      http://bbs.wuyou.net/search.php?*
// ==/UserScript==
(function() {
    'use strict';
    var link = $(".pbw .xs3 a");
    var a=link.find("a");
    for(var i=0;i<link.length; i++)
    {
        var href = $(link[i]).attr("href");
        var newhref = href.replace(/(&)?highlight=(\S*)(&)?/,"");
        $(link[i]).attr("href",newhref);
    }
    // Your code here...
})();
