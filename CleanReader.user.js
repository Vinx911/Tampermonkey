// ==UserScript==
// @name         CleanReader
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  启用后，自动进入简洁阅读模式。
// @author       VIIs
// @match        
// @include      http://blog.csdn.net/*/article/details/*
// @include      http://*.cnblogs.com/*/p/*
// @include      http://*.cnblogs.com/*/archive/*
// @include      http://*.cnblogs.com/*/articles/*
// @grant        none
// ==/UserScript==

var contents = {
  'blog.csdn.net': {
    'title':".article_title",
    'content':".article_content"
  },
  'www.cnblogs.com': {
	'title' :"#cb_post_title_url",
	'content':"#cnblogs_post_body"
  }
};

(function() {
    'use strict';
	
    var hostName = window.location.host;
    
    $("html").css("height","100%");
    $("body").css("height","100%");
    $("body").css("background","#ffffff");
    $("body").css("text-align","left");
    $("body").css("margin","0 0");
    $("body").css("padding","0 0");
        
    var CleanReader=document.createElement("div");
    $(CleanReader).css("background-color","#ffffff");
    $(CleanReader).css("width",1000);
    $(CleanReader).css("margin","0 auto");
    $(CleanReader).css("padding","20px 20px");
        
    var titleSelectors = contents[hostName].title.split("|");
    var titleText;
    for(var i=0;i<titleSelectors.length;i++)
	{
		if ($(titleSelectors[i]).length > 0)
        {
            titleText = $(titleSelectors[i]).text();
            break;        
        }
	}    
    
    var title = document.createElement("div");
    $(title).html(titleText);
    $(title).css('font-size', 32);
    $(title).css("margin","10px auto");
    $(title).css("padding","10px 0px");

    $(CleanReader).append(title);
    
    var textSelectors = contents[hostName].content.split("|");
    
	for(var j=0;j<textSelectors.length;j++)
	{
		$(CleanReader).append($(textSelectors[j]));
	}
    
    var mask=document.createElement("div");
   // $(mask).css("height","100%");
    $(mask).css("width","100%");
    $(mask).css("background-color","rgba(0,0,0,0.8)"); 
    $(mask).append(CleanReader);
    $("body").children().hide();
    $("body").prepend(mask); 
    
    if($("img").width() > $(CleanReader).width()-20)
    {
      $("img").width($(CleanReader).width()-20);
    }

    // Your code here...
})();
