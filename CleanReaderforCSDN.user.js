// ==UserScript==
// @name         CleanReader for CSDN
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  启用后，自动进入简洁阅读模式。
// @author       VIIs
// @match        
// @include      http://blog.csdn.net/*/article/details/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    $("html").css("height","100%");
    $("body").css("height","100%");
    var CleanReader=document.createElement("div");
    $(CleanReader).css("background-color","#ffffff");
    $(CleanReader).css("width",1000);
    $(CleanReader).css("margin","0 auto");
    $(CleanReader).css("padding","20px 20px");
    
    var title = document.createElement("div");
    $(title).html($(".article_title").html());
    $(title).css("margin","10px auto");
    $(title).css("padding","10px 0px");

    $(CleanReader).append(title);
    $(CleanReader).append($(".article_content"));
    
    var mask=document.createElement("div");
   // $(mask).css("height","100%");
    $(mask).css("width","100%");
    $(mask).css("background-color","rgba(0,0,0,0.8)"); 
    $(mask).append(CleanReader);
    $("body").children("div").hide();
    $("body").prepend(mask); 

    // Your code here...
})();
