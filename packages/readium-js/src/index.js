import * as Globals from "@baicie/readium-shared-js/globals";
import * as $ from "jquery";
import * as _ from "underscore";
import * as ReaderView from "@baicie/readium-shared-js/views/reader_view";
import * as PublicationFetcher from "./epub-fetch/publication_fetcher";
import * as PackageParser from "./epub-model/package_document_parser";
import * as IframeZipLoader from "./epub-fetch/iframe_zip_loader";
import * as IframeLoader from "@baicie/readium-shared-js/views/iframe_loader";

const DEBUG_VERSION_GIT = false;
const version = __buildVersion__;
// 兼容旧版本浏览器的polyfill
window.BlobBuilder =
    window.BlobBuilder ||
    window.WebKitBlobBuilder ||
    window.MozBlobBuilder ||
    window.MSBlobBuilder;

export class Readium {
    constructor(readiumOptions, readerOptions) {
        this._options = { mathJaxUrl: readerOptions.mathJaxUrl };

        this._contentDocumentTextPreprocessor = (src, contentDocumentHtml) => {
            const escapeMarkupEntitiesInUrl = (url) => {
                return url
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&apos;");
            };

            const injectedScript = () => {
                navigator.epubReadingSystem =
                    window.parent.navigator.epubReadingSystem;
            };

            const sourceParts = src.split("/");
            const baseHref = sourceParts.join("/");
            console.log("EPUB文档基础href：", baseHref);
            const base = `<base href="${encodeURI(
                escapeMarkupEntitiesInUrl(baseHref)
            )}"/>`;
            let scripts = `<script type="text/javascript">(${injectedScript.toString()})()</script>`;

            if (
                this._options &&
                this._options.mathJaxUrl &&
                contentDocumentHtml.search(/<(\w+:|)(?=math)/) >= 0
            ) {
                scripts += `<script type="text/javascript" src="${this._options.mathJaxUrl}"></script>`;
            }

            contentDocumentHtml = contentDocumentHtml.replace(
                /(<head[\s\S]*?>)/,
                "$1" + base + scripts
            );
            contentDocumentHtml = contentDocumentHtml.replace(
                /(<iframe[\s\S]+?)src[\s]*=[\s]*(["'])[\s]*(.*?)[\s]*(["'])([\s\S]*?>)/g,
                "$1data-src=$2$3$4$5"
            );
            contentDocumentHtml = contentDocumentHtml.replace(
                /(<iframe[\s\S]+?)data-src[\s]*=[\s]*(["'])[\s]*(http[s]?:\/\/.*?)[\s]*(["'])([\s\S]*?>)/g,
                "$1src=$2$3$4$5"
            );

            // 在Internet Explorer中空的title会使XHTML解析器崩溃（document.open/write/close代替BlobURI）
            contentDocumentHtml = contentDocumentHtml.replace(
                /<title>[\s]*<\/title>/g,
                "<title>TITLE</title>"
            );
            contentDocumentHtml = contentDocumentHtml.replace(
                /<title[\s]*\/>/g,
                "<title>TITLE</title>"
            );

            return contentDocumentHtml;
        };

        this._currentPublicationFetcher = undefined;
        this.getCurrentPublicationFetcher = () => {
            return this._currentPublicationFetcher;
        };

        const jsLibRoot = readiumOptions.jsLibRoot;

        if (!readiumOptions.useSimpleLoader) {
            readerOptions.iframeLoader = new IframeZipLoader(
                () => this._currentPublicationFetcher,
                this._contentDocumentTextPreprocessor
            );
        } else {
            readerOptions.iframeLoader = new IframeLoader();
        }

        readerOptions.needsFixedLayoutScalerWorkAround = true;

        this.reader = new ReaderView(readerOptions);
        ReadiumSDK.reader = this.reader;

        const openPackageDocument_ = (
            ebookURL,
            callback,
            openPageRequest,
            contentType
        ) => {
            if (this._currentPublicationFetcher) {
                this._currentPublicationFetcher.flushCache();
            }

            const cacheSizeEvictThreshold =
                readiumOptions.cacheSizeEvictThreshold || null;

            this._currentPublicationFetcher = new PublicationFetcher(
                ebookURL,
                jsLibRoot,
                window,
                cacheSizeEvictThreshold,
                this._contentDocumentTextPreprocessor,
                contentType
            );

            this._currentPublicationFetcher.initialize((resourceFetcher) => {
                if (!resourceFetcher) {
                    callback(undefined);
                    return;
                }

                const _packageParser = new PackageParser(
                    this._currentPublicationFetcher
                );

                _packageParser.parse((packageDocument) => {
                    if (!packageDocument) {
                        callback(undefined);
                        return;
                    }

                    const openBookOptions =
                        readiumOptions.openBookOptions || {};
                    const openBookData = $.extend(
                        packageDocument.getSharedJsPackageData(),
                        openBookOptions
                    );

                    if (openPageRequest) {
                        if (openPageRequest.spineItemCfi) {
                            openPageRequest.idref =
                                packageDocument.getSpineItemIdrefFromCFI(
                                    openPageRequest.spineItemCfi
                                );
                        }
                        openBookData.openPageRequest = openPageRequest;
                    }

                    this.reader.openBook(openBookData);

                    const options = { metadata: packageDocument.getMetadata() };

                    callback(packageDocument, options);
                });
            });
        };

        this.openPackageDocument = (ebookURL, callback, openPageRequest) => {
            if (!(ebookURL instanceof Blob || ebookURL instanceof File)) {
                console.debug("-------------------------------");

                let origin = window.location.origin;
                if (!origin) {
                    origin = `${window.location.protocol}//${window.location.host}`;
                }
                const thisRootUrl = origin + window.location.pathname;

                console.debug("基础URL: " + thisRootUrl);
                console.debug("相对URL: " + ebookURL);

                try {
                    ebookURL = new URL(ebookURL, thisRootUrl).toString();
                } catch (err) {
                    console.error(err);
                    console.log(ebookURL);
                }

                console.debug("==>");
                console.debug("绝对URL: " + ebookURL);
                console.debug("-------------------------------");

                if (
                    ebookURL.startsWith("http://") ||
                    ebookURL.startsWith("https://")
                ) {
                    const xhr = new XMLHttpRequest();
                    xhr.onreadystatechange = function () {
                        if (this.readyState != 4) return;

                        let contentType = undefined;

                        const success =
                            (xhr.status >= 200 && xhr.status < 300) ||
                            xhr.status === 304;
                        if (success) {
                            const allResponseHeaders = xhr
                                .getAllResponseHeaders()
                                .toLowerCase();
                            if (allResponseHeaders.includes("content-type")) {
                                contentType =
                                    xhr.getResponseHeader("Content-Type") ||
                                    xhr.getResponseHeader("content-type");
                                console.debug(
                                    "内容类型: " +
                                        ebookURL +
                                        " ==> " +
                                        contentType
                                );
                            }

                            const responseURL =
                                xhr.responseURL ||
                                xhr.getResponseHeader("Location") ||
                                xhr.getResponseHeader("location");
                            if (responseURL && responseURL !== ebookURL) {
                                console.debug(
                                    "重定向: " +
                                        ebookURL +
                                        " ==> " +
                                        responseURL
                                );
                                ebookURL = responseURL;
                            }
                        }

                        openPackageDocument_(
                            ebookURL,
                            callback,
                            openPageRequest,
                            contentType
                        );
                    };
                    xhr.open("HEAD", ebookURL, true);
                    xhr.send(null);

                    return;
                }
            }

            openPackageDocument_(ebookURL, callback, openPageRequest);
        };

        this.closePackageDocument = () => {
            if (this._currentPublicationFetcher) {
                this._currentPublicationFetcher.flushCache();
            }
        };

        Globals.logEvent("READER_INITIALIZED", "EMIT", "Readium.js");
        ReadiumSDK.emit(
            ReadiumSDK.Events.READER_INITIALIZED,
            ReadiumSDK.reader
        );
    }

    static version = version;

    static getVersion(callback) {
        const version = Readium.version;

        if (version.needsPopulating) {
            if (DEBUG_VERSION_GIT) {
                console.log("version.json 需要填充...");
            }

            const nextRepo = (i) => {
                if (i >= version.repos.length) {
                    delete version.needsPopulating;
                    delete version.repos;

                    if (DEBUG_VERSION_GIT) {
                        console.log("version");
                        console.debug(version);
                    }

                    Readium.version = version;
                    callback(version);
                    return;
                }

                const repo = version.repos[i];

                if (DEBUG_VERSION_GIT) {
                    console.log("##########################");
                    console.log("repo.name");
                    console.debug(repo.name);
                    console.log("repo.path");
                    console.debug(repo.path);
                }

                version[repo.name] = {};
                version[repo.name].timestamp = new Date().getTime();

                $.getJSON(repo.path + "/package.json", (data) => {
                    if (DEBUG_VERSION_GIT) {
                        console.log("version");
                        console.debug(data.version);
                    }

                    version[repo.name].version = data.version;
                    version[repo.name].chromeVersion =
                        "2." + data.version.substring(2);

                    const getRef = (gitFolder, repo, ref) => {
                        const url = gitFolder + "/" + ref;

                        if (DEBUG_VERSION_GIT) {
                            console.log("getRef");
                            console.debug(url);
                        }

                        $.get(url, (data) => {
                            version[repo.name].branch = ref;

                            const sha = data.trim();
                            version[repo.name].sha = sha;
                            if (DEBUG_VERSION_GIT) {
                                console.log("getRef OKAY");
                                console.debug(url);
                                console.log(data);
                                console.log("branch");
                                console.debug(ref);
                                console.log("sha");
                                console.debug(sha);
                            }

                            nextRepo(++i);
                        }).fail((err) => {
                            if (DEBUG_VERSION_GIT) {
                                console.log("getRef ERROR");
                                console.debug(url);
                            }

                            nextRepo(++i);
                        });
                    };

                    const getGit = (repo) => {
                        const url = repo.path + "/.git";

                        if (DEBUG_VERSION_GIT) {
                            console.log("getGit");
                            console.debug(url);
                        }

                        $.get(url, (data) => {
                            if (DEBUG_VERSION_GIT) {
                                console.log("getGit OKAY");
                                console.debug(url);
                                console.log(data);
                            }

                            if (data.startsWith("gitdir: ")) {
                                const gitDir =
                                    repo.path +
                                    "/" +
                                    data.substring("gitdir: ".length).trim();

                                if (DEBUG_VERSION_GIT) {
                                    console.log("gitdir: OKAY");
                                    console.log(gitDir);
                                }

                                getHead(gitDir, repo);
                            } else {
                                if (DEBUG_VERSION_GIT) {
                                    console.log("gitdir: ERROR");
                                }

                                nextRepo(++i);
                            }
                        }).fail((err) => {
                            if (DEBUG_VERSION_GIT) {
                                console.log("getGit ERROR");
                                console.debug(url);
                            }

                            nextRepo(++i);
                        });
                    };

                    const getHead = (gitFolder, repo, first) => {
                        const url = gitFolder + "/HEAD";

                        if (DEBUG_VERSION_GIT) {
                            console.log("getHead");
                            console.debug(url);
                        }

                        $.get(url, (data) => {
                            if (DEBUG_VERSION_GIT) {
                                console.log("getHead OKAY");
                                console.debug(url);
                                console.log(data);
                            }

                            const ref = data.substring(5).trim();
                            getRef(gitFolder, repo, ref);
                        }).fail((err) => {
                            if (DEBUG_VERSION_GIT) {
                                console.log("getHead ERROR");
                                console.debug(url);
                            }

                            if (first) {
                                getGit(repo);
                            } else {
                                if (DEBUG_VERSION_GIT) {
                                    console.log("getHead ABORT");
                                }
                                nextRepo(++i);
                            }
                        });
                    };

                    getHead(repo.path + "/.git", repo, true);
                }).fail(() => {
                    nextRepo(++i);
                });
            };

            nextRepo(0);
        } else {
            callback(version);
        }
    }
}
