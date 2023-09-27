// ==UserScript==
// @name         行业标准信息服务平台-标准下载
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://hbba.sacinfo.org.cn/attachment/onlineRead/*
// @require      https://cdn.bootcss.com/jquery/2.2.4/jquery.min.js
// @require      https://cdn.staticfile.org/jspdf/2.5.1/jspdf.umd.min.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=sacinfo.org.cn
// @grant        none
// @run-at       document-idle
// @license      GPL-3.0-only
// ==/UserScript==

(function () {
    'use strict';
    var J;
    if (typeof jQuery != 'undefined') { //避免与原网页中的Jquery冲突
        J = jQuery.noConflict(true);
    }

    const utils = {
        /**
         * 设置弹窗正文
         * @param {string} text
         */
        update_progress: function(text) {
            J(".download_pdf").text(text);
        },

        /**
         * 以指定原因弹窗提示并抛出错误
         * @param {string} reason
         */
        raise: function(reason) {
            alert(reason);
            throw new Error(reason);
        },

        /**
         * 返回一个包含计数器的迭代器, 其每次迭代值为 [index, value]
         * @param {Iterable} iterable
         * @returns
         */
        enumerate: function* (iterable) {
            let i = 0;
            for (let value of iterable) {
                yield [i, value];
                i++;
            }
        },

        /**
         * 等待全部任务落定后返回值的列表
         * @param {Array<Promise>} tasks
         * @returns {Promise<Array>} values
         */
        gather: async function (tasks) {
            const results = await Promise.allSettled(tasks);
            return results
                .filter(result => result.value)
                .map(result => result.value);
        },

        /**
         * 使用xhr异步GET请求目标url，返回响应体blob
         * @param {string} url
         * @returns {Promise<Blob>} blob
         */
        xhr_get_blob: async function (url) {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", url);
            xhr.responseType = "blob";

            return new Promise((resolve, reject) => {
                xhr.onload = () => {
                    const code = xhr.status;
                    if (code >= 200 && code <= 299) {
                        resolve(xhr.response);
                    }
                    else {
                        reject(new Error(`Network Error: ${code}`));
                    }
                };
                xhr.send();
            });
        },

        /**
         * 合并图像并导出PDF
         * @param {Iterable<HTMLCanvasElement | Uint8Array | HTMLImageElement>} imgs 图像元素列表
         * @param {string} title 文档标题
         */
        imgs_to_pdf: async function (imgs, title) {
            imgs = Array.from(imgs);
            if (imgs.length === 0) {
                this.raise("没有任何图像用于合并为PDF");
            }

            // 先获取第一个canvas用于判断竖向还是横向，以及得到页面长宽
            const first = imgs[0];
            let width = 0;
            let height = 0;

            // 自动检测canvas的长宽
            // 如果是字节数组
            if (first instanceof Uint8Array) {
                const cover = await createImageBitmap(
                    new Blob([first])
                );
                [width, height] = [cover.width, cover.height];

                // 如果是画布或图像元素
            } else if (
                first instanceof HTMLCanvasElement ||
                first instanceof HTMLImageElement
            ) {
                if (first.width && parseInt(first.width) && parseInt(first.height)) {
                    [width, height] = [first.width, first.height];
                } else {
                    const
                        width_str = first.style.width.replace(/(px)|(rem)|(em)/, ""),
                        height_str = first.style.height.replace(/(px)|(rem)|(em)/, "");
                    width = parseInt(width_str);
                    height = parseInt(height_str);
                }
            } else {
                // 其他未知类型
                throw TypeError("不能处理的画布元素类型：" + this.classof(first));
            }
            console.log(`canvas数据: 宽: ${width}px: 高: ${height}px`);

            // 如果文档第一页的宽比长更大，则landscape，否则portrait
            const orientation = width > height ? 'l' : 'p';
            // jsPDF的第三个参数为format，当自定义时，参数为数字数组。
            const pdf = new jspdf.jsPDF(orientation, 'px', [height, width]);

            const last = imgs.pop();
            const self = this;
            // 保存每一页文档到每一页pdf
            imgs.forEach((canvas, i) => {
                pdf.addImage(canvas, 'png', 0, 0, width, height);
                pdf.addPage();
                self?.update_progress(`PDF 已经绘制 ${i + 1}`);
            });
            // 添加尾页
            pdf.addImage(last, 'png', 0, 0, width, height);
            pdf.save(`${title}.pdf`);
        },

        /**
         * 图片blobs合并并导出为单个PDF
         * @param {Array<Blob>} blobs
         * @param {string} title (可选)文档名称, 不含后缀, 默认为"文档"
         * @param {boolean} filter (可选)是否过滤 type 不以 "image/" 开头的 blob; 默认为 true
         * @param {boolean} blob (可选)是否返回 blob，默认 false
         */
        img_blobs_to_pdf: async function (blobs, title = "文档", filter = true, blob = false) {
            // 格式转换：img blob -> bmp
            let tasks = blobs;
            if (filter) {
                tasks = blobs.filter(
                    blob => blob.type.startsWith("image/")
                );
            }
            tasks = await this.gather(
                tasks.map(blob => blob.arrayBuffer())
            );
            tasks = tasks.map(buffer => new Uint8Array(buffer));
            // 导出PDF
            return this.imgs_to_pdf(tasks, title, 0, 0);
        },

        /**
         * 下载可以简单直接请求的图片，合并到 PDF 并导出
         * @param {Iterable<string>} urls 图片链接列表
         * @param {string} title 文档名称
         * @param {number} min_num 如果成功获取的图片数量 < min_num, 则等待 2 秒后重试; 默认 0 不重试
         * @param {boolean} clear 是否在请求完成后清理控制台输出，默认false
         * @param {boolean} blobs 是否返回二进制图片列表，默认 false（即直接导出PDF）
         */
        img_urls_to_pdf: async function (urls, title) {
            // 强制转换为迭代器类型
            urls = urls[Symbol.iterator]();
            const first = urls.next().value;

            // 发起请求
            let tasks = [this.xhr_get_blob(first)];  // 初始化时加入第一个
            // 然后加入剩余的
            for (const [i, url] of this.enumerate(urls)) {
                tasks.push(this.xhr_get_blob(url));
                this.update_progress(`已经请求 ${i} 张图片`);
            }

            // 接收响应
            let img_blobs = (await this.gather(tasks)).filter(
                blob => blob.type.startsWith("image/")
            );

            await this.img_blobs_to_pdf(img_blobs, title);
        },
    }

    const hbba_sacinfo = {
        getImageBaseUrl: function () {
            let href = location.href;
            let index = href.lastIndexOf('\/') + 1;
            let file = href.substring(index, href.length);

            return "https://hbba.sacinfo.org.cn/hbba_onlineRead_page/" + file + "/";
        },

        genImageUrl: function* () {
            let baseUrl = this.getImageBaseUrl();

            // 来源于页面
            let pageSize = Page.size;
            for (var page = 0; page < pageSize; page++) {
                yield baseUrl + page + ".png";
            }
        },

        main: function () {
            var download_button = document.createElement("button");
            J(download_button).attr("type", "button");
            J(download_button).attr("id", "download_pdf");
            J(download_button).text("下载PDF");
            J(".help_content").prepend(download_button);

            J(download_button).click(function () {
                let title = document.title.split("_")[0];
                return utils.img_urls_to_pdf(hbba_sacinfo.genImageUrl(), title);
            });
        }
    };


    /**
     * 主函数：识别网站，执行对应文档下载策略
     */
    function main(host = null) {
        // 绑定函数到全局
        window.wk_main = main;

        // 显示当前位置
        host = host || location.hostname;
        const params = new URL(location.href).searchParams;
        console.log(`当前 host: ${host}`);

        if (host === "hbba.sacinfo.org.cn") {
            hbba_sacinfo.main();
        } else {
            console.log("匹配到了无效网页");
        }
    }


    setTimeout(main, 1000);

})();
