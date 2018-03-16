// ==UserScript==
// @name         CleanReader
// @namespace    https://greasyfork.org/zh-CN/users/141921
// @version      0.3
// @description  启用后，自动进入简洁阅读模式。
// @author       Vinx
// @match
// @require      https://cdn.bootcss.com/jquery/2.2.4/jquery.min.js
// @require      https://greasyfork.org/scripts/38955-jquery-print/code/jQueryprint.js?version=254772
// @include      *
// @grant        none
// ==/UserScript==

var contents = {
  'blog.csdn.net': {
    'title':".article_title|.csdn_top",
    'content':".article_content"
  },
  'www.cnblogs.com': {
	'title' :"#cb_post_title_url",
	'content':"#cnblogs_post_body"
  },
  'blog.sina.com.cn': {
	'title' :".articalTitle",
	'content':".articalContent"
  },
  'bbs.fishc.com': {
	'title' :"#thread_subject",
	'content':"[id^='postmessage_']:first"
  },
  'www.liaoxuefeng.com': {
	'title' :".x-content h4",
	'content':".x-main-content"
  },
  'blog.163.com': {
	'title' :".title.pre.fs1",
	'content':".bct.fc05.fc11.nbw-blog.ztag"
  }
};

(function() {
    'use strict';
    var J;
    if (typeof jQuery != 'undefined') {  //避免与原网页中的Jquery冲突
        J = jQuery.noConflict(true);
    }

    AddTemplateSite();

    if(!IsContentPage()) return;

    J("head").append('<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.css">');

    var html_height     = J("html").css("height");
	var body_height     = J("body").css("height");
	var body_background = J("body").css("background");
    var body_text_align = J("body").css("text-align");
    var body_margin     = J("body").css("margin");
    var body_padding    = J("body").css("padding");
    var body_overflow_y = J("body").css("overflow-y");

    var readbutton=document.createElement("div");
    //J(readbutton).css("background-color","#ffffff");
    J(readbutton).css("width",24);
    J(readbutton).css("height",24);
    J(readbutton).css("right",32);
    J(readbutton).css("bottom",32);
    J(readbutton).css("z-index",999999);
    J(readbutton).css("cursor","pointer");
    J(readbutton).css("position","fixed");
    J(readbutton).css("margin","0 auto");
    J(readbutton).css("color","#0593d3");
    J(readbutton).css("font-size",24);
    J(readbutton).attr("class","fa fa-book fa-2");
    J(readbutton).attr("id","readbutton");

    var printbutton=document.createElement("div");
    J(printbutton).css("width",24);
    J(printbutton).css("height",24);
    J(printbutton).css("right",32);
    J(printbutton).css("bottom",64);
    J(printbutton).css("z-index",999999);
    J(printbutton).css("cursor","pointer");
    J(printbutton).css("position","fixed");
    J(printbutton).css("margin","0 auto");
    J(printbutton).css("color","#0593d3");
    J(printbutton).css("font-size",24);
    J(printbutton).attr("class","fa fa-print fa-2");
    J(printbutton).attr("id","printbutton");

    J("body").prepend(readbutton);
    J("body").prepend(printbutton);
    J("#printbutton").hide();

    J("#printbutton").click(function(){
        J("#CleanReader").print();
    });

    J("#readbutton").click(function(){
        var isShow = J(readbutton).attr("userdata");
        if(isShow == "true")
        {
            CencelCleanRead();
            J("#printbutton").hide();
        }
        else
        {
            CleanRead();
            J("#printbutton").show();
        }
    });

    function IsContentPage()
    {
        if(!contents.hasOwnProperty(window.location.host)) return false;

        var isContentPage = false;
        var tmp1 = contents[window.location.host].content.split("|");
        for(var i=0;i<tmp1.length;i++)
        {
            if (J(tmp1[i]).length > 0)
            {
                isContentPage = true;
                break;
            }
        }

        if(!isContentPage) return false;

        return true;
    }

    function AddTemplateSite()
    {
        var jsonstr={};
        //Discuz
        if(J("meta[name='generator'][content]").length > 0 && J("meta[name='generator'][content]").attr("content").indexOf("Discuz") >= 0)
        {
            jsonstr.title = "#thread_subject";
            jsonstr.content = "[id^='postmessage_']:first|.pattl";
            contents[window.location.host] = jsonstr;
        }
    }

	function CleanRead()
	{
		var hostName = window.location.host;

		J("html").css("height","100%");
		J("body").css("height","100%");
		J("body").css("background","#ffffff");
		J("body").css("text-align","left");
		J("body").css("margin","0 0");
		J("body").css("padding","0 0");
		J("body").css("overflow-y","hidden");

		var CleanReader=document.createElement("div");
		J(CleanReader).css("background-color","#ffffff");
		J(CleanReader).css("width",1000);
		J(CleanReader).css("height","100%");
		J(CleanReader).css("margin","0 auto");
		J(CleanReader).css("padding","0px 20px");
		J(CleanReader).css("overflow-y","auto");
        J(CleanReader).attr("id","CleanReader");

		var titleSelectors = contents[hostName].title.split("|");
		var titleText;
		for(var i=0;i<titleSelectors.length;i++)
		{
			if (J(titleSelectors[i]).length > 0)
			{
				titleText = J(titleSelectors[i]).text();
				break;
			}
		}

		var title = document.createElement("div");
		J(title).html(titleText);
		J(title).css('font-size', 32);
		J(title).css("margin","10px auto");
		J(title).css("padding","10px 0px");
		J(title).css("text-align","center");

		J(CleanReader).append(title);
		J(CleanReader).append("<hr/>");

		var textSelectors = contents[hostName].content.split("|");
		for(var j=0;j<textSelectors.length;j++)
		{
			J(CleanReader).append(J(textSelectors[j]).clone());
		}

        J(CleanReader).children().css("margin","0px auto");

		var mask=document.createElement("div");
		J(mask).css("height","100%");
		J(mask).css("width","100%");
		J(mask).css("background-color","rgba(0,0,0,0.9)");
		J(mask).css("z-index",999997);
		J(mask).css("position","fixed");
		J(mask).css("margin","0 auto");
        J(mask).attr("id","CleanReadermask");
		J(mask).append(CleanReader);

		J("body").prepend(mask);

		var image =  J(CleanReader).find("img");
		for(var k=0;k<image.length;k++)
		{
			if( J(image[k]).width() > J(CleanReader).width()-20)
			{
				J(image[k]).width(J(CleanReader).width()-20);
			}
		}
        J(readbutton).attr("userdata","true");
	}

    function CencelCleanRead()
    {
        J("#CleanReadermask").remove();

        J("html").css("height",html_height);
		J("body").css("height",body_height);
		J("body").css("background",body_background);
		J("body").css("text-align",body_text_align);
		J("body").css("margin",body_margin);
		J("body").css("padding",body_padding);
		J("body").css("overflow-y",body_overflow_y);

        J(readbutton).attr("userdata","");

    }

})();

