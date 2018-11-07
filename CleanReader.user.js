// ==UserScript==
// @name         CleanReader
// @namespace    https://greasyfork.org/zh-CN/users/141921
// @version      0.3.3
// @description  启用后，自动进入简洁阅读模式。
// @author       Vinx
// @match
// @require      https://cdn.bootcss.com/jquery/2.2.4/jquery.min.js
// @require      https://greasyfork.org/scripts/38955-jquery-print/code/jQueryprint.js?version=254772
// @include      *
// @grant        none
// @note         2018.11.07-V0.3.3 修复了CSDN打印的问题，添加OSChina等网站
// @note         2018.03.18-V0.3.2 添加放大缩小按钮，并支持按键缩放（+/= :放大，- :缩小）
// @note         2018.03.18-V0.3.1 添加ESC退出阅读模式功能
// @note         2018.03.15-V0.3.0 添加对Discuz论坛的支持，修改标题和内容居中显示
// @note         2018.02.28-V0.2.0 不在自动进入，添加了阅读及打印按钮
// @note         2017.07.19-V0.1.0 首次发布，启用后，自动进入简洁阅读模式。
// ==/UserScript==

var contents = {
  'blog.csdn.net': {
    'title':".title-article|.csdn_top",
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
  },
  'www.runoob.com': {
	'title' :".article-intro h1:first",
	'content':".article-body"
  },
  'lib.uml.com.cn': {
	'title' :".arttitle",
	'content':".artcontent"
  },
  'bbs.pediy.com': {
	'title' :".break-all.subject",
	'content':".message.break-all:first"
  },
  'my.oschina.net': {
	'title' :".article-detail>.header",
	'content':"#articleContent"
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

    var read_button=document.createElement("div");
    J(read_button).css("width",24);
    J(read_button).css("height",24);
    J(read_button).css("right",32);
    J(read_button).css("bottom",32);
    J(read_button).css("z-index",999999);
    J(read_button).css("cursor","pointer");
    J(read_button).css("position","fixed");
    J(read_button).css("margin","0 auto");
    J(read_button).css("color","#0593d3");
    J(read_button).css("font-size",24);
    J(read_button).attr("class","fa fa-book fa-2");
    J(read_button).attr("id","readbutton");

    var print_button=document.createElement("div");
    J(print_button).css("width",24);
    J(print_button).css("height",24);
    J(print_button).css("right",32);
    J(print_button).css("bottom",64);
    J(print_button).css("z-index",999999);
    J(print_button).css("cursor","pointer");
    J(print_button).css("position","fixed");
    J(print_button).css("margin","0 auto");
    J(print_button).css("color","#0593d3");
    J(print_button).css("font-size",24);
    J(print_button).attr("class","fa fa-print fa-2");
    J(print_button).attr("id","printbutton");

    var zoom_out_button=document.createElement("div");
    J(zoom_out_button).css("width",24);
    J(zoom_out_button).css("height",24);
    J(zoom_out_button).css("right",32);
    J(zoom_out_button).css("bottom",96);
    J(zoom_out_button).css("z-index",999999);
    J(zoom_out_button).css("cursor","pointer");
    J(zoom_out_button).css("position","fixed");
    J(zoom_out_button).css("margin","0 auto");
    J(zoom_out_button).css("color","#0593d3");
    J(zoom_out_button).css("font-size",24);
    J(zoom_out_button).attr("class","fa fa-search-minus fa-2");
    J(zoom_out_button).attr("id","zoomoutbutton");

    var zoom_in_button=document.createElement("div");
    J(zoom_in_button).css("width",24);
    J(zoom_in_button).css("height",24);
    J(zoom_in_button).css("right",32);
    J(zoom_in_button).css("bottom",128);
    J(zoom_in_button).css("z-index",999999);
    J(zoom_in_button).css("cursor","pointer");
    J(zoom_in_button).css("position","fixed");
    J(zoom_in_button).css("margin","0 auto");
    J(zoom_in_button).css("color","#0593d3");
    J(zoom_in_button).css("font-size",24);
    J(zoom_in_button).attr("class","fa fa-search-plus fa-2");
    J(zoom_in_button).attr("id","zoominbutton");

    J("body").prepend(read_button);
    J("body").prepend(print_button);
    J("body").prepend(zoom_in_button);
    J("body").prepend(zoom_out_button);
    J("#printbutton").hide();
    J("#zoominbutton").hide();
    J("#zoomoutbutton").hide();

    J("#readbutton").click(function(){
        var isShow = J(read_button).attr("userdata");
        if(isShow == "true")
        {
            CencelCleanRead();
            J("#printbutton").hide();
            J("#zoominbutton").hide();
            J("#zoomoutbutton").hide();
			zoom=0;
        }
        else
        {
            CleanRead();
            J("#printbutton").show();
            J("#zoominbutton").show();
            J("#zoomoutbutton").show();
        }
    });	

    J("#printbutton").click(function(){
        J("#CleanReader").print({
            globalStyles: false,
            mediaPrint: false,
            stylesheet: null,
            noPrintSelector: ".no-print",
            iframe: true,
            append: null,
            prepend: null,
            manuallyCopyFormValues: true,
            deferred: $.Deferred()
        });
    });
	
	//ESC退出
	J(document).keyup(function(){
        var isShow = J(read_button).attr("userdata");
        if(event.keyCode == 27 && isShow == "true")
        {
            CencelCleanRead();
            J("#printbutton").hide();
            J("#zoominbutton").hide();
            J("#zoomoutbutton").hide();
			zoom=0;
        }
    });

	//放大缩小
    var zoom=0;
    J("#zoominbutton").click(function(){
        zoom+=10;
        J("#CleanReader").css("zoom",1+zoom/100);
    });

    J("#zoomoutbutton").click(function(){
        zoom-=10;
        J("#CleanReader").css("zoom",1+zoom/100);
    });
	
    J(document).keydown(function(){
        var isShow = J(read_button).attr("userdata");
        if(event.keyCode == 107 || event.keyCode == 187)
        {
            zoom+=10;
            J("#CleanReader").css("zoom",1+zoom/100);
        }
        else if(event.keyCode == 109 || event.keyCode == 189)
        {
            zoom-=10;
            J("#CleanReader").css("zoom",1+zoom/100);
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
        J(read_button).attr("userdata","true");
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

        J(read_button).attr("userdata","");

    }

})();

