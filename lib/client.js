// dsh-prompt-manager — browser-side prompt library and session injector for DeepSeek Harness.
window.__ModuleLoader__.load({
	id: "dsh-prompt-manager",
	factory: function (require) {
		var React = require("react");
		var R = React.createElement;

		var STORAGE_KEY = "dsh-prompt-manager.prompts";
		var INJECTION_STORAGE_KEY = "dsh-prompt-manager.session-injections";
		var STORAGE_VERSION = 2;
		var INJECTION_STORAGE_VERSION = 2;
		var LOCALE_NS = "dsh-prompt-manager";
		var MAX_PROMPTS = 500;
		var MAX_CANDIDATES = 20;
		var MAX_TITLE_LENGTH = 160;
		var MAX_CONTENT_LENGTH = 100000;
		var MAX_TAGS = 20;
		var MAX_TAG_LENGTH = 40;
		var MAX_SAVED_INJECTIONS = 20;
		var MAX_ACTIVE_PROMPTS = 12;

		var messages = {
			zh: {
				manager: "提示词管理",
				title: "提示词库",
				subtitle: "保存在当前浏览器。输入 /prompt 或 /提示词 打开列表，也可以直接用 /关键词 搜索。",
				search: "搜索标题、标签或内容…",
				searchLabel: "搜索提示词",
				newPrompt: "新建",
				importPrompts: "导入",
				exportPrompts: "导出",
				allCount: "共 {count} 条提示词",
				matchCount: "，匹配 {count} 条",
				empty: "还没有提示词，先创建一条吧。",
				noMatch: "没有匹配结果，换个关键词试试。",
				favorite: "收藏",
				unfavorite: "取消收藏",
				favoriteBadge: "常用",
				copy: "复制",
				copied: "已复制",
				copyFailed: "复制失败，请手动选择内容复制。",
				inject: "注入",
				injectTitle: "注入为当前会话的系统提示词",
				injectedBadge: "已注入",
				noActiveSession: "请先打开一个会话，再注入提示词。",
				injectionPending: "正在注入提示词「{title}」…",
				injectionActive: "提示词「{title}」已注入",
				injectionHint: "它会作为当前会话的系统指令参与后续请求，不会出现在普通聊天记录里。",
				removeInjection: "移除提示词",
				removingInjection: "正在移除…",
				injectionFailed: "提示词注入失败：{message}",
				removeInjectionFailed: "移除失败：{message}",
				retryInjection: "重试",
				promptControl: "提示词",
				promptControlActive: "提示词 · {title}",
				promptControlCount: "提示词 · {count}",
				injectionCountActive: "当前会话已加入 {count} 条提示词",
				pickerTitle: "为当前会话选择提示词",
				pickerHint: "只对当前会话及从它新建的分支生效。",
				pickerEmpty: "还没有提示词，请先在设置中添加。",
				pickerClose: "关闭提示词选择",
				pickerActive: "当前已注入：{title}",
				selectPrompt: "注入「{title}」",
				removeSelectedPrompt: "移除「{title}」",
				pickerActiveCount: "已加入 {count} 条",
				pickerClear: "全部移除",
				edit: "编辑",
				remove: "删除",
				confirmRemove: "再次点击确认",
				done: "完成",
				createTitle: "新建提示词",
				editTitle: "编辑提示词",
				editorHint: "保存后，输入 /prompt 或 /提示词 打开列表，也可以直接输入 /关键词 搜索。",
				fieldTitle: "标题",
				fieldTitlePlaceholder: "例如：代码审查",
				fieldTags: "标签（用逗号分隔）",
				fieldTagsPlaceholder: "例如：开发, 审查",
				fieldContent: "提示词内容",
				fieldContentPlaceholder: "输入正文，可用 {{占位符}} 标记每次需要替换的内容。",
				characters: "{count} / {max} 字符",
				save: "保存",
				cancel: "取消",
				titleRequired: "请填写标题。",
				contentRequired: "请填写提示词内容。",
				storageReadFailed: "浏览器存储不可用，本次修改只能暂存在当前页面。",
				storageCorrupt: "本地数据格式异常，原数据尚未被覆盖。建议先导入一份有效备份。",
				storageWriteFailed: "无法写入浏览器存储，本次修改可能在刷新后丢失。",
				importTitle: "确认导入",
				importSummary: "读取到 {count} 条有效提示词。你可以合并到现有库，或完全替换。",
				importSkipped: "另有 {count} 条无效或重复数据已跳过。",
				merge: "合并",
				replace: "替换",
				importInvalid: "无法导入：请选择由本插件导出的有效 JSON 文件。",
				importReadFailed: "读取文件失败，请重试。",
				importMerged: "已合并 {count} 条提示词。",
				importReplaced: "已导入 {count} 条提示词。",
				exportSuccess: "备份已导出。",
				exportFailed: "导出失败，请稍后重试。",
				dismiss: "关闭提示",
				loadFailed: "提示词管理加载失败：{message}",
				slashDescription: "{tags}{content}",
				slashFallback: "提示词",
				slashInjectHint: "选择后注入为当前会话的系统提示词",
				untitled: "未命名提示词",
				seedCodeReview: "代码审查",
				seedCodeReviewContent: "请对下面的代码做一次全面审查，指出潜在的 bug、安全隐患、性能问题与可读性问题，并给出具体的修改建议。\n\n{{代码}}",
				seedTests: "编写单元测试",
				seedTestsContent: "请为下面的函数编写单元测试，覆盖正常路径、边界条件与异常情况，测试框架使用 {{测试框架}}。\n\n{{代码}}",
				seedExplain: "解释代码",
				seedExplainContent: "请用通俗易懂的语言解释下面这段代码：它做了什么、关键逻辑是什么、有哪些可以改进的地方。\n\n{{代码}}",
				seedWeekly: "周报助手",
				seedWeeklyContent: "请根据我们本次对话的进展，生成一份简洁的周报草稿：本周完成、遇到的问题、下周计划。"
			},
			en: {
				manager: "Prompt Manager",
				title: "Prompt library",
				subtitle: "Stored in this browser. Type /prompt or /提示词 to open the list, or search directly with /keyword.",
				search: "Search titles, tags, or content…",
				searchLabel: "Search prompts",
				newPrompt: "New",
				importPrompts: "Import",
				exportPrompts: "Export",
				allCount: "{count} prompts",
				matchCount: ", {count} matches",
				empty: "No prompts yet. Create your first one.",
				noMatch: "No matches. Try a different search.",
				favorite: "Favorite",
				unfavorite: "Remove favorite",
				favoriteBadge: "Favorite",
				copy: "Copy",
				copied: "Copied",
				copyFailed: "Copy failed. Please select and copy the content manually.",
				inject: "Inject",
				injectTitle: "Inject as this session's system prompt",
				injectedBadge: "Injected",
				noActiveSession: "Open a session before injecting a prompt.",
				injectionPending: "Injecting “{title}”…",
				injectionActive: "Prompt “{title}” is injected",
				injectionHint: "It applies to future requests as a session-level system instruction and is not posted as a chat message.",
				removeInjection: "Remove prompt",
				removingInjection: "Removing…",
				injectionFailed: "Could not inject the prompt: {message}",
				removeInjectionFailed: "Could not remove the prompt: {message}",
				retryInjection: "Retry",
				promptControl: "Prompts",
				promptControlActive: "Prompt · {title}",
				promptControlCount: "Prompts · {count}",
				injectionCountActive: "{count} prompts are active in this session",
				pickerTitle: "Choose prompts for this session",
				pickerHint: "Applies only to this session and branches created from it.",
				pickerEmpty: "No prompts yet. Add one in Settings first.",
				pickerClose: "Close prompt picker",
				pickerActive: "Currently injected: {title}",
				selectPrompt: "Inject “{title}”",
				removeSelectedPrompt: "Remove “{title}”",
				pickerActiveCount: "{count} selected",
				pickerClear: "Clear all",
				edit: "Edit",
				remove: "Delete",
				confirmRemove: "Click again to confirm",
				done: "Done",
				createTitle: "New prompt",
				editTitle: "Edit prompt",
				editorHint: "Once saved, type /prompt or /提示词 to open the list, or search directly with /keyword.",
				fieldTitle: "Title",
				fieldTitlePlaceholder: "For example: Code review",
				fieldTags: "Tags (comma separated)",
				fieldTagsPlaceholder: "For example: development, review",
				fieldContent: "Prompt content",
				fieldContentPlaceholder: "Write the prompt here. Use {{placeholders}} for details that change each time.",
				characters: "{count} / {max} characters",
				save: "Save",
				cancel: "Cancel",
				titleRequired: "Add a title first.",
				contentRequired: "Add some prompt content first.",
				storageReadFailed: "Browser storage is unavailable. Changes will only last until this page closes.",
				storageCorrupt: "The local data format is invalid and has not been overwritten. Import a valid backup to recover.",
				storageWriteFailed: "Could not write to browser storage. This change may be lost after a refresh.",
				importTitle: "Confirm import",
				importSummary: "Found {count} valid prompts. Merge them into your library or replace it completely.",
				importSkipped: "{count} invalid or duplicate entries were skipped.",
				merge: "Merge",
				replace: "Replace",
				importInvalid: "Import failed. Choose a valid JSON file exported by this plugin.",
				importReadFailed: "Could not read that file. Please try again.",
				importMerged: "Merged {count} prompts.",
				importReplaced: "Imported {count} prompts.",
				exportSuccess: "Backup exported.",
				exportFailed: "Export failed. Please try again.",
				dismiss: "Dismiss message",
				loadFailed: "Prompt Manager failed to load: {message}",
				slashDescription: "{tags}{content}",
				slashFallback: "Prompt",
				slashInjectHint: "Select to inject as this session's system prompt",
				untitled: "Untitled prompt",
				seedCodeReview: "Code review",
				seedCodeReviewContent: "Review the code below. Call out bugs, security risks, performance issues, and readability problems, then suggest concrete improvements.\n\n{{code}}",
				seedTests: "Write unit tests",
				seedTestsContent: "Write unit tests for the function below. Cover the happy path, edge cases, and failures using {{test framework}}.\n\n{{code}}",
				seedExplain: "Explain code",
				seedExplainContent: "Explain the code below in plain language: what it does, how the key logic works, and what could be improved.\n\n{{code}}",
				seedWeekly: "Weekly update",
				seedWeeklyContent: "Turn the progress from this conversation into a concise weekly update with: completed work, blockers, and next week's plan."
			}
		};

		var activeLocale = "zh";
		var boundTranslate = null;
		var localeListeners = [];
		function formatMessage(value, params) {
			return String(value).replace(/\{([a-zA-Z0-9_]+)\}/g, function (_, key) {
				return params && Object.prototype.hasOwnProperty.call(params, key) ? String(params[key]) : "{" + key + "}";
			});
		}
		function t(key, params) {
			var value;
			try { if (boundTranslate) value = boundTranslate(key, params); } catch (e) { value = null; }
			if (value == null || value === key) value = (messages[activeLocale] || messages.zh)[key] || messages.en[key] || key;
			return formatMessage(value, params);
		}
		function localeSnapshot() { return activeLocale; }
		function subscribeLocale(listener) {
			localeListeners.push(listener);
			return function () {
				var index = localeListeners.indexOf(listener);
				if (index >= 0) localeListeners.splice(index, 1);
			};
		}
		function setActiveLocale(value) {
			var next = String(value || "").toLowerCase().indexOf("en") === 0 ? "en" : "zh";
			if (next === activeLocale) return;
			activeLocale = next;
			localeListeners.slice().forEach(function (listener) { listener(); });
		}

		var css = [
			".pm-section{box-sizing:border-box;width:100%;max-width:780px;display:flex;flex-direction:column;gap:14px;color:var(--dsw-alias-label-primary)}",
			".pm-header{display:flex;flex-direction:column;gap:4px}",
			".pm-title{font-size:16px;font-weight:650;line-height:24px;letter-spacing:-.01em}",
			".pm-hint,.pm-status,.pm-counter{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}",
			".pm-toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap}",
			".pm-search{box-sizing:border-box;min-width:190px;height:38px;flex:1 1 260px;color:var(--dsw-alias-label-primary);background:var(--dsw-specific-input-major,var(--dsw-alias-bg-layer-1));border:1px solid var(--dsw-alias-border-l1);border-radius:10px;outline:none;padding:0 12px;font:inherit;font-size:13px}",
			".pm-search::placeholder,.pm-input::placeholder,.pm-textarea::placeholder{color:var(--dsw-alias-label-dimmed)}",
			".pm-search:focus,.pm-input:focus,.pm-textarea:focus{border-color:var(--dsw-alias-brand-primary);outline:2px solid color-mix(in srgb,var(--dsw-alias-brand-primary) 28%,transparent);outline-offset:1px}",
			".pm-button,.pm-icon-btn{box-sizing:border-box;min-height:36px;border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary);cursor:pointer;background:transparent;border-radius:9px;padding:7px 12px;font:inherit;font-size:12px;line-height:18px;display:inline-flex;align-items:center;justify-content:center;gap:6px;white-space:nowrap}",
			".pm-button:hover,.pm-icon-btn:hover{background:var(--dsw-alias-bg-layer-2)}",
			".pm-button:focus-visible,.pm-icon-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}",
			".pm-button[data-primary='1']{color:var(--dsw-alias-label-primary-foreground);border-color:var(--dsw-alias-button-primary-fill);background:var(--dsw-alias-button-primary-fill)}",
			".pm-button[data-primary='1']:hover{border-color:var(--dsw-alias-button-primary-hover);background:var(--dsw-alias-button-primary-hover)}",
			".pm-button[data-danger='1'],.pm-icon-btn[data-danger='1']{color:var(--dsw-alias-state-error-primary)}",
			".pm-button:disabled,.pm-icon-btn:disabled{cursor:not-allowed;opacity:.45}",
			".pm-list{display:flex;flex-direction:column;gap:8px;max-height:min(54vh,460px);overflow:auto;padding:2px;margin:-2px;scrollbar-gutter:stable}",
			".pm-card{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);border-radius:12px;padding:11px 12px;display:flex;flex-direction:column;gap:7px}",
			".pm-card[data-favorite='1']{border-color:color-mix(in srgb,var(--dsw-alias-brand-primary) 42%,var(--dsw-alias-border-l1))}",
			".pm-card-row{display:flex;align-items:flex-start;gap:10px;min-width:0}",
			".pm-card-main{min-width:0;flex:1 1 auto;display:flex;flex-direction:column;gap:5px}",
			".pm-card-heading{display:flex;align-items:center;gap:7px;min-width:0;flex-wrap:wrap}",
			".pm-card-title{font-size:13px;font-weight:650;line-height:20px;overflow-wrap:anywhere}",
			".pm-badge{color:var(--dsw-alias-brand-primary);background:color-mix(in srgb,var(--dsw-alias-brand-primary) 10%,transparent);border-radius:999px;padding:1px 7px;font-size:10px;line-height:17px}",
			".pm-tags{display:flex;flex-wrap:wrap;align-items:center;gap:4px}",
			".pm-tag{color:var(--dsw-alias-label-tertiary);background:var(--dsw-alias-bg-layer-2);border-radius:5px;padding:1px 7px;font-size:11px;line-height:17px}",
			".pm-excerpt{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;white-space:pre-wrap;word-break:break-word;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}",
			".pm-actions{flex:0 0 auto;display:flex;align-items:center;gap:4px;flex-wrap:wrap;justify-content:flex-end}",
			".pm-icon-btn{min-width:36px;padding:7px 9px;border-color:transparent}",
			".pm-icon-btn[data-flash='1']{color:var(--dsw-alias-state-success-primary,var(--dsw-alias-brand-primary))}",
			".pm-empty{color:var(--dsw-alias-label-secondary);border:1px dashed var(--dsw-alias-border-l2);border-radius:12px;padding:28px 16px;font-size:13px;line-height:20px;text-align:center}",
			".pm-form{display:flex;flex-direction:column;gap:12px}",
			".pm-field{display:flex;flex-direction:column;gap:5px}",
			".pm-field-head{display:flex;align-items:center;justify-content:space-between;gap:12px}",
			".pm-label{font-size:12px;font-weight:550;line-height:18px}",
			".pm-input,.pm-textarea{box-sizing:border-box;width:100%;color:var(--dsw-alias-label-primary);background:var(--dsw-specific-input-major,var(--dsw-alias-bg-layer-1));border:1px solid var(--dsw-alias-border-l1);border-radius:9px;outline:none;padding:8px 11px;font:inherit;font-size:13px;line-height:20px}",
			".pm-textarea{min-height:190px;resize:vertical}",
			".pm-form-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}",
			".pm-notice{box-sizing:border-box;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);border-radius:10px;padding:9px 11px;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}",
			".pm-notice[data-error='1']{color:var(--dsw-alias-state-error-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 45%,var(--dsw-alias-border-l1))}",
			".pm-notice-actions{display:flex;align-items:center;gap:6px;flex:0 0 auto;flex-wrap:wrap}",
			".pm-import{display:flex;flex-direction:column;gap:9px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);border-radius:12px;padding:12px}",
			".pm-import-title{font-size:13px;font-weight:650;line-height:20px}",
			".pm-control-root{box-sizing:border-box;min-width:0;position:relative;display:inline-flex;align-items:center}",
			".pm-composer-control{box-sizing:border-box;min-width:0;max-width:220px;height:28px;border:0;border-radius:24px;background:transparent;color:var(--dsw-alias-label-secondary);padding:4px 8px;font:inherit;font-size:12px;line-height:20px;display:inline-flex;align-items:center;gap:6px;cursor:pointer;white-space:nowrap}",
			".pm-composer-control:hover,.pm-composer-control[aria-expanded='true']{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover,var(--dsw-alias-bg-layer-2))}",
			".pm-composer-control[data-active='1']{color:var(--dsw-alias-brand-primary);background:color-mix(in srgb,var(--dsw-alias-brand-primary) 9%,transparent)}",
			".pm-composer-control:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}.pm-composer-control:disabled{cursor:not-allowed;opacity:.5}",
			".pm-control-icon,.pm-control-chevron{display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto}.pm-control-label{min-width:0;overflow:hidden;text-overflow:ellipsis}.pm-control-chevron{transition:transform 180ms ease}.pm-composer-control[aria-expanded='true'] .pm-control-chevron{transform:rotate(180deg)}",
			".pm-picker-menu{box-sizing:border-box;z-index:20;position:absolute;left:0;bottom:calc(100% + 8px);width:min(320px,calc(100vw - 32px));max-height:min(360px,calc(100vh - 96px));border:1px solid var(--dsw-alias-border-inverted,var(--dsw-alias-border-l1));border-radius:12px;background:var(--dsw-specific-menu,var(--dsw-alias-bg-layer-1));box-shadow:var(--dsw-shadow-lv3);padding:4px;display:flex;flex-direction:column;gap:4px;color:var(--dsw-alias-label-primary);overflow:hidden}",
			".pm-picker-search{box-sizing:border-box;width:100%;height:34px;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-specific-input-major,var(--dsw-alias-bg-layer-1));color:var(--dsw-alias-label-primary);padding:0 9px;font:inherit;font-size:12px;outline:none}.pm-picker-search:focus{border-color:var(--dsw-alias-brand-primary);outline:2px solid color-mix(in srgb,var(--dsw-alias-brand-primary) 24%,transparent);outline-offset:0}",
			".pm-picker-active{box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:32px;border-radius:8px;background:color-mix(in srgb,var(--dsw-alias-brand-primary) 9%,transparent);color:var(--dsw-alias-brand-primary);padding:5px 8px;font-size:11px;line-height:18px}.pm-picker-active span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
			".pm-picker-active[data-error='1']{color:var(--dsw-alias-state-error-primary);background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 7%,transparent)}",
			".pm-picker-remove{box-sizing:border-box;min-height:26px;border:0;border-radius:7px;background:transparent;color:inherit;padding:3px 6px;font:inherit;font-size:11px;cursor:pointer}.pm-picker-remove:hover{background:color-mix(in srgb,currentColor 9%,transparent)}.pm-picker-remove:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:0}.pm-picker-remove:disabled{cursor:not-allowed;opacity:.5}",
			".pm-picker-list{min-height:0;display:flex;flex-direction:column;gap:1px;overflow-y:auto;overscroll-behavior:contain;touch-action:pan-y;scrollbar-gutter:stable}.pm-picker-item{box-sizing:border-box;width:100%;min-height:42px;border:0;border-radius:10px;background:transparent;color:var(--dsw-alias-label-primary);text-align:left;padding:5px 8px;display:flex;align-items:center;gap:8px;cursor:pointer}.pm-picker-item:hover,.pm-picker-item:focus-visible{background:var(--dsw-alias-interactive-bg-hover,var(--dsw-alias-bg-layer-2));outline:none}.pm-picker-item:focus-visible{box-shadow:inset 0 0 0 2px var(--dsw-alias-brand-primary)}.pm-picker-item:disabled{cursor:wait;opacity:.55}.pm-picker-item[data-selected='1']{background:color-mix(in srgb,var(--dsw-alias-brand-primary) 8%,transparent)}",
			".pm-picker-item-copy{min-width:0;flex:1;display:flex;flex-direction:column;gap:0}.pm-picker-item-title{font-size:12px;font-weight:600;line-height:18px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pm-picker-item-detail{color:var(--dsw-alias-label-tertiary);font-size:10px;line-height:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pm-picker-check{box-sizing:border-box;width:16px;height:16px;border:1px solid var(--dsw-alias-border-l2);border-radius:5px;display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;color:transparent}.pm-picker-item[data-selected='1'] .pm-picker-check{border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary-foreground,#fff)}.pm-picker-empty{color:var(--dsw-alias-label-secondary);padding:18px 10px;text-align:center;font-size:12px;line-height:18px}",
			".pm-visually-hidden{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}",
			"@media(max-width:640px){.pm-toolbar{align-items:stretch}.pm-search{flex-basis:100%;width:100%}.pm-button,.pm-icon-btn{min-height:44px}.pm-card-row{flex-direction:column}.pm-actions{width:100%;justify-content:flex-start}.pm-list{max-height:none}.pm-notice{flex-direction:column}.pm-import .pm-button{flex:1 1 auto}.pm-composer-control{max-width:150px;min-height:40px}.pm-picker-menu{width:min(320px,calc(100vw - 24px))}.pm-picker-remove{min-height:40px}.pm-picker-item{min-height:48px}}",
			"@media(prefers-reduced-motion:reduce){.pm-section *,.pm-composer-control *,.pm-picker-menu *{scroll-behavior:auto!important;transition:none!important}}"
		].join("\n");

		function uid() {
			return "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
		}
		function finiteNumber(value, fallback) {
			var number = Number(value);
			return Number.isFinite(number) && number >= 0 ? number : fallback;
		}
		function normalizeTags(raw) {
			var values = Array.isArray(raw) ? raw : String(raw || "").split(/[,，;；]/);
			var seen = Object.create(null);
			var result = [];
			for (var i = 0; i < values.length && result.length < MAX_TAGS; i++) {
				var tag = String(values[i] == null ? "" : values[i]).trim().slice(0, MAX_TAG_LENGTH);
				var key = tag.toLocaleLowerCase();
				if (!tag || seen[key]) continue;
				seen[key] = true;
				result.push(tag);
			}
			return result;
		}
		function sanitizePrompt(value, options) {
			if (!value || typeof value !== "object" || Array.isArray(value)) return null;
			var title = String(value.title == null ? "" : value.title).trim().slice(0, MAX_TITLE_LENGTH);
			var content = String(value.content == null ? "" : value.content).trim().slice(0, MAX_CONTENT_LENGTH);
			if (!title || !content) return null;
			var now = Date.now();
			return {
				id: options && options.forceNewId ? uid() : String(value.id || uid()).trim().slice(0, 180) || uid(),
				title: title,
				content: content,
				tags: normalizeTags(value.tags),
				updatedAt: finiteNumber(value.updatedAt, now),
				favorite: value.favorite === true,
				useCount: Math.floor(finiteNumber(value.useCount, 0)),
				lastUsedAt: finiteNumber(value.lastUsedAt, 0)
			};
		}
		function sanitizePrompts(values, options) {
			if (!Array.isArray(values)) return { prompts: [], skipped: 0 };
			var prompts = [];
			var seen = Object.create(null);
			var skipped = 0;
			for (var i = 0; i < values.length && prompts.length < MAX_PROMPTS; i++) {
				var prompt = sanitizePrompt(values[i], options);
				if (!prompt || seen[prompt.id]) { skipped++; continue; }
				seen[prompt.id] = true;
				prompts.push(prompt);
			}
			if (values.length > prompts.length + skipped) skipped += values.length - prompts.length - skipped;
			return { prompts: prompts, skipped: skipped };
		}
		function readStorageDocument() {
			try {
				var raw = window.localStorage.getItem(STORAGE_KEY);
				if (raw == null) return { exists: false, prompts: [], error: "" };
				var parsed = JSON.parse(raw);
				var values = Array.isArray(parsed) ? parsed : parsed && parsed.prompts;
				if (!Array.isArray(values)) return { exists: true, prompts: [], error: "storageCorrupt" };
				var clean = sanitizePrompts(values);
				return { exists: true, prompts: clean.prompts, error: clean.skipped ? "storageCorrupt" : "" };
			} catch (e) {
				return { exists: true, prompts: [], error: e && e.name === "SyntaxError" ? "storageCorrupt" : "storageReadFailed" };
			}
		}
		function writeStorage(prompts) {
			try {
				window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, exportedAt: new Date().toISOString(), prompts: prompts }));
				return "";
			} catch (e) { return "storageWriteFailed"; }
		}
		function makeSeeds() {
			var values = activeLocale === "en" ? [
				{ title: t("seedCodeReview"), tags: ["development", "review"], content: t("seedCodeReviewContent") },
				{ title: t("seedTests"), tags: ["development", "testing"], content: t("seedTestsContent") },
				{ title: t("seedExplain"), tags: ["learning"], content: t("seedExplainContent") },
				{ title: t("seedWeekly"), tags: ["productivity"], content: t("seedWeeklyContent") }
			] : [
				{ title: t("seedCodeReview"), tags: ["开发", "审查"], content: t("seedCodeReviewContent") },
				{ title: t("seedTests"), tags: ["开发", "测试"], content: t("seedTestsContent") },
				{ title: t("seedExplain"), tags: ["学习"], content: t("seedExplainContent") },
				{ title: t("seedWeekly"), tags: ["效率"], content: t("seedWeeklyContent") }
			];
			return sanitizePrompts(values, { forceNewId: true }).prompts;
		}

		var store = { prompts: [], storageError: "", ready: false };
		var storeListeners = [];
		function snapshot() { return store; }
		function subscribe(listener) {
			storeListeners.push(listener);
			return function () {
				var index = storeListeners.indexOf(listener);
				if (index >= 0) storeListeners.splice(index, 1);
			};
		}
		function notify() { storeListeners.slice().forEach(function (listener) { listener(); }); }
		function setStore(prompts, storageError) {
			store = { prompts: prompts, storageError: storageError || "", ready: true };
			notify();
		}
		function initializeStore() {
			if (store.ready) return;
			var documentValue = readStorageDocument();
			if (documentValue.exists) {
				setStore(documentValue.prompts, documentValue.error);
				if (!documentValue.error) mirrorLibraryToHost();
				return;
			}
			// A missing localStorage document means a fresh browser profile or a
			// changed Web origin (the desktop app picks a new port per launch).
			// Recover the durable host copy before re-seeding the four defaults.
			setStore([], "");
			restoreLibraryFromHost();
		}
		function persist(prompts) {
			var clean = sanitizePrompts(prompts).prompts;
			setStore(clean, writeStorage(clean));
			mirrorLibraryToHost();
		}
		function fetchLibrary() {
			return requestInjectionApi("/prompt-manager/library");
		}
		function pushLibrary(prompts) {
			return requestInjectionApi("/prompt-manager/library", { prompts: sanitizePrompts(prompts).prompts });
		}
		function mirrorLibraryToHost() {
			pushLibrary(store.prompts).catch(function () {});
		}
		function restoreLibraryFromHost() {
			fetchLibrary().then(function (payload) {
				var remote = payload && Array.isArray(payload.prompts) ? sanitizePrompts(payload.prompts).prompts : [];
				if (remote.length) {
					setStore(remote, writeStorage(remote));
				} else {
					var seeds = makeSeeds();
					setStore(seeds, writeStorage(seeds));
					pushLibrary(seeds).catch(function () {});
				}
			}, function () {
				var seeds = makeSeeds();
				setStore(seeds, writeStorage(seeds));
			});
		}
		function reloadFromStorage() {
			var value = readStorageDocument();
			setStore(value.exists ? value.prompts : [], value.error);
		}
		function addPrompt(fields) {
			var prompt = sanitizePrompt({
				id: uid(), title: fields.title, content: fields.content, tags: fields.tags,
				updatedAt: Date.now(), favorite: false, useCount: 0, lastUsedAt: 0
			});
			if (!prompt) return null;
			persist(store.prompts.concat([prompt]));
			return prompt;
		}
		function updatePrompt(id, fields) {
			var next = store.prompts.map(function (item) {
				if (item.id !== id) return item;
				return sanitizePrompt({
					id: item.id, title: fields.title, content: fields.content, tags: fields.tags,
					updatedAt: Date.now(), favorite: item.favorite, useCount: item.useCount, lastUsedAt: item.lastUsedAt
				}) || item;
			});
			persist(next);
		}
		function removePrompt(id) { persist(store.prompts.filter(function (item) { return item.id !== id; })); }
		function toggleFavorite(id) {
			persist(store.prompts.map(function (item) {
				if (item.id !== id) return item;
				return Object.assign({}, item, { favorite: !item.favorite, updatedAt: Date.now() });
			}));
		}
		function touchPrompt(id) {
			persist(store.prompts.map(function (item) {
				if (item.id !== id) return item;
				return Object.assign({}, item, { useCount: (item.useCount || 0) + 1, lastUsedAt: Date.now() });
			}));
		}
		function allPrompts() { initializeStore(); return store.prompts; }

		function normalizeQuery(value) { return String(value || "").trim().toLocaleLowerCase(); }
		function stripPromptAlias(value) {
			return String(value || "").replace(/^(?:prompt|提示词)(?:\s+|$)/i, "").trim();
		}
		function promptMatches(prompt, query) {
			var normalized = normalizeQuery(query);
			if (!normalized) return true;
			return (prompt.title + " " + prompt.tags.join(" ") + " " + prompt.content).toLocaleLowerCase().indexOf(normalized) !== -1;
		}
		function rankingScore(prompt, query) {
			var normalized = normalizeQuery(query);
			var title = prompt.title.toLocaleLowerCase();
			var tags = prompt.tags.join(" ").toLocaleLowerCase();
			var content = prompt.content.toLocaleLowerCase();
			var score = prompt.favorite ? 120 : 0;
			score += Math.min(prompt.useCount || 0, 30) * 2;
			if (prompt.lastUsedAt) score += Math.min(40, Math.max(0, 40 - (Date.now() - prompt.lastUsedAt) / 86400000));
			if (normalized) {
				if (title === normalized) score += 1000;
				else if (title.indexOf(normalized) === 0) score += 700;
				else if (title.indexOf(normalized) !== -1) score += 500;
				if (tags.indexOf(normalized) !== -1) score += 300;
				if (content.indexOf(normalized) !== -1) score += 80;
			}
			return score;
		}
		function rankPrompts(prompts, query) {
			return prompts.filter(function (prompt) { return promptMatches(prompt, query); }).slice().sort(function (a, b) {
				var score = rankingScore(b, query) - rankingScore(a, query);
				if (score) return score;
				return (b.updatedAt || 0) - (a.updatedAt || 0) || a.title.localeCompare(b.title);
			});
		}
		function promptDescription(prompt) {
			var tags = prompt.tags && prompt.tags.length ? prompt.tags.slice(0, 3).join(" · ") + " — " : "";
			var oneLine = String(prompt.content || "").replace(/\s+/g, " ").trim();
			if (oneLine.length > 58) oneLine = oneLine.slice(0, 58) + "…";
			return tags + oneLine || t("slashFallback");
		}
		function parseImportText(text) {
			try {
				var parsed = JSON.parse(String(text || ""));
				var values = Array.isArray(parsed) ? parsed : parsed && parsed.prompts;
				if (!Array.isArray(values)) return { ok: false, prompts: [], skipped: 0 };
				var clean = sanitizePrompts(values);
				if (values.length && !clean.prompts.length) return { ok: false, prompts: [], skipped: values.length };
				return { ok: true, prompts: clean.prompts, skipped: clean.skipped };
			} catch (e) { return { ok: false, prompts: [], skipped: 0 }; }
		}
		function mergePromptSets(current, incoming) {
			var combined = current.concat(incoming);
			var byId = Object.create(null);
			for (var i = 0; i < combined.length; i++) byId[combined[i].id] = combined[i];
			return sanitizePrompts(Object.keys(byId).map(function (id) { return byId[id]; })).prompts;
		}
		function exportDocument(prompts) {
			return JSON.stringify({
				format: "dsh-prompt-manager",
				version: STORAGE_VERSION,
				exportedAt: new Date().toISOString(),
				prompts: sanitizePrompts(prompts).prompts
			}, null, 2) + "\n";
		}

		// ── Ordered system-prompt selections per DSH session ──────────────────
		var injectionStore = { bySession: {}, pendingBySession: {}, errorBySession: {}, ready: false };
		var injectionListeners = [];
		var injectionRequests = Object.create(null);
		function sanitizeInjectionRecord(value) {
			if (!value || typeof value !== "object" || Array.isArray(value)) return null;
			var sessionId = String(value.sessionId == null ? "" : value.sessionId).trim().slice(0, 200);
			if (sessionId && value.disabled === true) {
				return { sessionId: sessionId, disabled: true, activatedAt: finiteNumber(value.activatedAt, Date.now()) };
			}
			var sources = Array.isArray(value.prompts) ? value.prompts : [value.prompt || value];
			var prompts = [];
			var seen = Object.create(null);
			for (var i = 0; i < sources.length && prompts.length < MAX_ACTIVE_PROMPTS; i++) {
				var prompt = sanitizePrompt(sources[i]);
				if (!prompt || seen[prompt.id]) continue;
				seen[prompt.id] = true;
				prompts.push({ id: prompt.id, title: prompt.title, content: prompt.content });
			}
			if (!sessionId || !prompts.length) return null;
			return {
				sessionId: sessionId,
				prompts: prompts,
				activatedAt: finiteNumber(value.activatedAt || (sources[0] && sources[0].activatedAt), Date.now())
			};
		}
		function readInjectionStorage() {
			try {
				var raw = window.localStorage.getItem(INJECTION_STORAGE_KEY);
				if (!raw) return {};
				var parsed = JSON.parse(raw);
				var values = Array.isArray(parsed) ? parsed : parsed && parsed.injections;
				if (!Array.isArray(values)) return {};
				var bySession = {};
				values.forEach(function (value) {
					var record = sanitizeInjectionRecord(value);
					if (record) bySession[record.sessionId] = record;
				});
				return bySession;
			} catch (error) { return {}; }
		}
		function writeInjectionStorage(bySession) {
			try {
				var values = Object.keys(bySession).map(function (sessionId) { return bySession[sessionId]; }).sort(function (a, b) {
					return b.activatedAt - a.activatedAt;
				}).slice(0, MAX_SAVED_INJECTIONS);
				window.localStorage.setItem(INJECTION_STORAGE_KEY, JSON.stringify({
					version: INJECTION_STORAGE_VERSION, injections: values
				}));
				return true;
			} catch (error) { return false; }
		}
		function initializeInjectionStore() {
			if (injectionStore.ready) return;
			injectionStore = { bySession: readInjectionStorage(), pendingBySession: {}, errorBySession: {}, ready: true };
		}
		function reloadInjectionsFromStorage() {
			initializeInjectionStore();
			publishInjectionState(readInjectionStorage(), null, null, false);
		}
		function injectionSnapshot() { initializeInjectionStore(); return injectionStore; }
		function subscribeInjections(listener) {
			injectionListeners.push(listener);
			return function () {
				var index = injectionListeners.indexOf(listener);
				if (index >= 0) injectionListeners.splice(index, 1);
			};
		}
		function publishInjectionState(bySession, pendingBySession, errorBySession, persistValue) {
			injectionStore = {
				bySession: bySession || injectionStore.bySession,
				pendingBySession: pendingBySession || injectionStore.pendingBySession,
				errorBySession: errorBySession || injectionStore.errorBySession,
				ready: true
			};
			if (persistValue) writeInjectionStorage(injectionStore.bySession);
			injectionListeners.slice().forEach(function (listener) { listener(); });
		}
		function setInjectionPending(sessionId, pending, error) {
			initializeInjectionStore();
			var pendingMap = Object.assign({}, injectionStore.pendingBySession);
			var errorMap = Object.assign({}, injectionStore.errorBySession);
			if (pending) pendingMap[sessionId] = pending === true ? { action: "sync", title: "" } : pending;
			else delete pendingMap[sessionId];
			if (error) errorMap[sessionId] = typeof error === "object" ? error : { message: String(error) };
			else delete errorMap[sessionId];
			publishInjectionState(null, pendingMap, errorMap, false);
		}
		function setActiveInjection(sessionId, value) {
			initializeInjectionStore();
			var bySession = Object.assign({}, injectionStore.bySession);
			if (value && value.disabled === true) {
				bySession[sessionId] = { sessionId: sessionId, disabled: true, activatedAt: Date.now() };
			} else if (value) {
				var values = Array.isArray(value) ? value : value.prompts || [value];
				var record = sanitizeInjectionRecord({ sessionId: sessionId, prompts: values, activatedAt: value.activatedAt });
				if (record) bySession[sessionId] = record;
			} else delete bySession[sessionId];
			publishInjectionState(bySession, null, null, true);
		}
		function apiErrorMessage(payload, response) {
			if (payload && payload.error) return String(payload.error);
			return "HTTP " + String(response.status);
		}
		function requestInjectionApi(path, body) {
			var options = body === undefined ? { method: "GET", cache: "no-store" } : {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(body)
			};
			return window.fetch(path, options).then(function (response) {
				return response.json().catch(function () { return {}; }).then(function (payload) {
					if (!response.ok || payload.ok === false) throw new Error(apiErrorMessage(payload, response));
					return payload;
				});
			});
		}
		function activateSessionPrompt(sessionId, prompt) {
			if (!sessionId || !prompt) return Promise.resolve(false);
			setInjectionPending(sessionId, { action: "activate", title: prompt.title }, "");
			var request = requestInjectionApi("/prompt-manager/activate", {
				sessionId: sessionId,
				prompt: { id: prompt.id, title: prompt.title, content: prompt.content }
			}).then(function (payload) {
				var current = injectionSnapshot().bySession[sessionId];
				var fallback = current && current.prompts ? current.prompts.filter(function (item) { return item.id !== prompt.id; }).concat([prompt]) : [prompt];
				setActiveInjection(sessionId, payload.prompts && payload.prompts.length ? payload.prompts : fallback);
				setInjectionPending(sessionId, false, "");
				touchPrompt(prompt.id);
				return true;
			}, function (error) {
				setInjectionPending(sessionId, false, {
					action: "activate",
					message: error && error.message ? error.message : String(error),
					prompt: { id: prompt.id, title: prompt.title, content: prompt.content }
				});
				return false;
			});
			injectionRequests[sessionId] = request;
			return request.then(function (result) {
				if (injectionRequests[sessionId] === request) delete injectionRequests[sessionId];
				return result;
			});
		}
		function removeSessionPrompt(sessionId, promptId) {
			if (!sessionId) return Promise.resolve(false);
			var current = injectionSnapshot().bySession[sessionId];
			var currentPrompts = current && current.prompts ? current.prompts : [];
			var target = promptId ? currentPrompts.find(function (prompt) { return prompt.id === promptId; }) : null;
			setInjectionPending(sessionId, { action: "remove", title: target ? target.title : "" }, "");
			var body = { sessionId: sessionId };
			if (promptId) body.promptId = promptId;
			var request = requestInjectionApi("/prompt-manager/remove", body).then(function (payload) {
				var prompts = payload.prompts || [];
				setActiveInjection(sessionId, prompts.length ? prompts : { disabled: true });
				setInjectionPending(sessionId, false, "");
				return true;
			}, function (error) {
				setInjectionPending(sessionId, false, {
					action: "remove",
					message: error && error.message ? error.message : String(error),
					prompt: target
				});
				return false;
			});
			injectionRequests[sessionId] = request;
			return request.then(function (result) {
				if (injectionRequests[sessionId] === request) delete injectionRequests[sessionId];
				return result;
			});
		}
		function syncSessionPrompt(sessionId) {
			if (!sessionId) return Promise.resolve(false);
			initializeInjectionStore();
			if (injectionRequests[sessionId]) return injectionRequests[sessionId];
			var local = injectionStore.bySession[sessionId];
			if (local && local.disabled === true) return removeSessionPrompt(sessionId);
			var localPrompts = local && local.prompts ? local.prompts : [];
			setInjectionPending(sessionId, { action: "sync", title: localPrompts[0] ? localPrompts[0].title : "" }, "");
			var request = requestInjectionApi("/prompt-manager/session?sessionId=" + encodeURIComponent(sessionId)).then(function (payload) {
				var remotePrompts = payload.prompts || (payload.active ? [payload.active] : []);
				if (remotePrompts.length) {
					setActiveInjection(sessionId, remotePrompts);
					setInjectionPending(sessionId, false, "");
					return true;
				}
				if (localPrompts.length) {
					return requestInjectionApi("/prompt-manager/activate", { sessionId: sessionId, prompts: localPrompts }).then(function (restored) {
						setActiveInjection(sessionId, restored.prompts && restored.prompts.length ? restored.prompts : localPrompts);
						setInjectionPending(sessionId, false, "");
						return true;
					});
				}
				setActiveInjection(sessionId, null);
				setInjectionPending(sessionId, false, "");
				return false;
			}).catch(function (error) {
				setInjectionPending(sessionId, false, {
					action: "sync",
					message: error && error.message ? error.message : String(error),
					prompt: localPrompts[0] || null
				});
				return false;
			});
			injectionRequests[sessionId] = request;
			return request.then(function (result) {
				if (injectionRequests[sessionId] === request) delete injectionRequests[sessionId];
				return result;
			});
		}

		function fallbackCopy(text) {
			try {
				var area = document.createElement("textarea");
				area.value = text;
				area.style.position = "fixed";
				area.style.opacity = "0";
				document.body.appendChild(area);
				area.select();
				var ok = document.execCommand("copy");
				document.body.removeChild(area);
				return ok;
			} catch (e) { return false; }
		}
		function copyText(text) {
			if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
				return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return fallbackCopy(text); });
			}
			return Promise.resolve(fallbackCopy(text));
		}
		function downloadBackup(prompts) {
			try {
				var blob = new Blob([exportDocument(prompts)], { type: "application/json;charset=utf-8" });
				var url = URL.createObjectURL(blob);
				var anchor = document.createElement("a");
				anchor.href = url;
				anchor.download = "dsh-prompts-" + new Date().toISOString().slice(0, 10) + ".json";
				document.body.appendChild(anchor);
				anchor.click();
				document.body.removeChild(anchor);
				window.setTimeout(function () { URL.revokeObjectURL(url); }, 0);
				return true;
			} catch (e) { return false; }
		}

		function Notice(props) {
			return R("div", { className: "pm-notice", "data-error": props.error ? "1" : "0", role: props.error ? "alert" : "status" },
				R("span", null, props.text),
				props.onDismiss ? R("button", { type: "button", className: "pm-icon-btn", onClick: props.onDismiss, "aria-label": t("dismiss") }, "×") : null
			);
		}

		function PromptControlIcon(props) {
			return R("span", { className: "pm-control-icon", "aria-hidden": "true" },
				R("svg", { width: "15", height: "15", viewBox: "0 0 16 16", fill: "none" },
					props.active
						? R("path", { d: "m3 8 3 3 7-7", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round" })
						: R("path", { d: "M4 2.5h8a1.5 1.5 0 0 1 1.5 1.5v5A1.5 1.5 0 0 1 12 10.5H7L3.25 13v-2.75A1.5 1.5 0 0 1 2.5 9V4A1.5 1.5 0 0 1 4 2.5Z", stroke: "currentColor", strokeWidth: "1.35", strokeLinejoin: "round" })
				)
			);
		}

		function PromptControl(props) {
			React.useSyncExternalStore(subscribeLocale, localeSnapshot);
			var data = React.useSyncExternalStore(subscribeInjections, injectionSnapshot);
			var rootRef = React.useRef(null);
			var openState = React.useState(false);
			var expanded = openState[0];
			var setExpanded = openState[1];
			var queryState = React.useState("");
			var query = queryState[0];
			var setQuery = queryState[1];
			var sessionId = String(props.sessionId || "");
			React.useEffect(function () {
				if (sessionId) syncSessionPrompt(sessionId);
			}, [sessionId]);
			React.useEffect(function () {
				setExpanded(false);
				setQuery("");
			}, [sessionId]);
			React.useEffect(function () {
				if (!expanded) return;
				function dismiss(event) {
					if (!rootRef.current || rootRef.current.contains(event.target)) return;
					setExpanded(false);
					setQuery("");
				}
				function onKeyDown(event) {
					if (event.key !== "Escape") return;
					setExpanded(false);
					setQuery("");
				}
				document.addEventListener("pointerdown", dismiss, true);
				document.addEventListener("keydown", onKeyDown, true);
				return function () {
					document.removeEventListener("pointerdown", dismiss, true);
					document.removeEventListener("keydown", onKeyDown, true);
				};
			}, [expanded]);
			var record = sessionId ? data.bySession[sessionId] : null;
			var pending = sessionId ? data.pendingBySession[sessionId] : null;
			var error = sessionId ? data.errorBySession[sessionId] : null;
			var prompts = record && record.prompts ? record.prompts : [];
			var title = prompts[0] ? prompts[0].title : pending && pending.title;
			var active = prompts.length > 0;
			var label = prompts.length > 1
				? t("promptControlCount", { count: prompts.length })
				: active || (pending && pending.action === "activate")
					? t("promptControlActive", { title: title || t("untitled") })
					: t("promptControl");
			var tooltip = error
				? t(error.action === "remove" ? "removeInjectionFailed" : "injectionFailed", { message: error.message || "Unknown error" })
				: prompts.length > 1 ? t("injectionCountActive", { count: prompts.length }) : active ? t("injectionActive", { title: title }) : t("injectTitle");
			return R("div", {
				ref: rootRef, className: "pm-control-root",
				onBlur: function (event) {
					if (!expanded || (event.relatedTarget && rootRef.current && rootRef.current.contains(event.relatedTarget))) return;
					setExpanded(false);
					setQuery("");
				}
			},
				R("button", {
					type: "button", className: "pm-composer-control", "data-active": active ? "1" : "0",
					"aria-haspopup": "dialog", "aria-expanded": expanded, "aria-controls": "pm-prompt-picker-" + sessionId,
					disabled: !sessionId, title: tooltip,
					onClick: function () {
						setExpanded(!expanded);
						if (expanded) setQuery("");
					}
				},
					R(PromptControlIcon, { active: active }),
					R("span", { className: "pm-control-label" }, label),
					R("span", { className: "pm-control-chevron", "aria-hidden": "true" },
						R("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "none" },
							R("path", { d: "m3 4.5 3 3 3-3", stroke: "currentColor", strokeWidth: "1.3", strokeLinecap: "round", strokeLinejoin: "round" })
						)
					)
				),
				expanded ? R(PromptPickerMenu, { sessionId: sessionId, query: query, setQuery: setQuery }) : null
			);
		}

		function PromptPickerMenu(props) {
			React.useSyncExternalStore(subscribeLocale, localeSnapshot);
			var library = React.useSyncExternalStore(subscribe, snapshot);
			var injections = React.useSyncExternalStore(subscribeInjections, injectionSnapshot);
			var searchRef = React.useRef(null);
			var menuRef = React.useRef(null);
			var listRef = React.useRef(null);
			var sessionId = String(props.sessionId || "");
			var record = injections.bySession[sessionId];
			var pending = injections.pendingBySession[sessionId];
			var error = injections.errorBySession[sessionId];
			var activePrompts = record && record.prompts ? record.prompts : [];
			var selectedIds = Object.create(null);
			activePrompts.forEach(function (prompt) { selectedIds[prompt.id] = true; });
			var prompts = rankPrompts(library.prompts, props.query).slice(0, 60);
			var visibleIds = Object.create(null);
			prompts.forEach(function (prompt) { visibleIds[prompt.id] = true; });
			activePrompts.slice().reverse().forEach(function (prompt) {
				var query = normalizeQuery(props.query);
				var matches = !query || (prompt.title + " " + prompt.content).toLocaleLowerCase().indexOf(query) !== -1;
				if (!visibleIds[prompt.id] && matches) prompts.unshift(prompt);
			});
			React.useEffect(function () {
				if (searchRef.current) searchRef.current.focus();
			}, []);
			React.useEffect(function () {
				var menu = menuRef.current;
				var list = listRef.current;
				if (!menu || !list) return;
				function containWheel(event) {
					if (event.ctrlKey) return;
					var delta = event.deltaY;
					if (event.deltaMode === 1) delta *= 16;
					else if (event.deltaMode === 2) delta *= Math.max(list.clientHeight, 1);
					var maximum = Math.max(0, list.scrollHeight - list.clientHeight);
					if (maximum > 0 && delta) list.scrollTop = Math.max(0, Math.min(maximum, list.scrollTop + delta));
					event.preventDefault();
					event.stopPropagation();
				}
				menu.addEventListener("wheel", containWheel, { passive: false });
				return function () { menu.removeEventListener("wheel", containWheel); };
			}, [prompts.length > 0]);
			var errorText = error ? t(error.action === "remove" ? "removeInjectionFailed" : "injectionFailed", { message: error.message || "Unknown error" }) : "";
			return R("div", {
				id: "pm-prompt-picker-" + sessionId, ref: menuRef, className: "pm-picker-menu",
				role: "dialog", "aria-label": t("pickerTitle")
			},
				R("input", {
					ref: searchRef, className: "pm-picker-search", type: "search", value: props.query,
					placeholder: t("search"), "aria-label": t("searchLabel"),
					onChange: function (event) { props.setQuery(String(event.target.value || "")); }
				}),
				errorText ? R("div", { className: "pm-picker-active", "data-error": "1", role: "alert" }, R("span", null, errorText)) : null,
				activePrompts.length ? R("div", { className: "pm-picker-active", role: "status" },
					R("span", null, t("pickerActiveCount", { count: activePrompts.length })),
					R("button", {
						type: "button", className: "pm-picker-remove", disabled: !!pending,
						onClick: function () { removeSessionPrompt(sessionId); }
					}, pending && pending.action === "remove" ? t("removingInjection") : t("pickerClear"))
				) : null,
				prompts.length ? R("div", { ref: listRef, className: "pm-picker-list", role: "group", "aria-label": t("pickerTitle") }, prompts.map(function (prompt) {
					var selected = !!selectedIds[prompt.id];
					return R("button", {
						key: prompt.id, type: "button", "aria-pressed": selected,
						className: "pm-picker-item", "data-selected": selected ? "1" : "0", disabled: !!pending,
						"aria-label": t(selected ? "removeSelectedPrompt" : "selectPrompt", { title: prompt.title }),
						onClick: function () {
							if (selected) removeSessionPrompt(sessionId, prompt.id);
							else activateSessionPrompt(sessionId, prompt);
						}
					},
						R("span", { className: "pm-picker-item-copy" },
							R("span", { className: "pm-picker-item-title" }, prompt.title),
							R("span", { className: "pm-picker-item-detail" }, promptDescription(prompt))
						),
						R("span", { className: "pm-picker-check", "aria-hidden": "true" }, selected ? "✓" : "")
					);
				})) : R("div", { className: "pm-picker-empty" }, library.prompts.length ? t("noMatch") : t("pickerEmpty"))
			);
		}

		function PromptCard(props) {
			var prompt = props.prompt;
			var deleting = props.confirm === prompt.id;
			return R("article", { className: "pm-card", "data-favorite": prompt.favorite ? "1" : "0" },
				R("div", { className: "pm-card-row" },
					R("div", { className: "pm-card-main" },
						R("div", { className: "pm-card-heading" },
							R("div", { className: "pm-card-title" }, prompt.title),
							prompt.favorite ? R("span", { className: "pm-badge" }, t("favoriteBadge")) : null
						),
						prompt.tags.length ? R("div", { className: "pm-tags" }, prompt.tags.map(function (tag) {
							return R("span", { key: tag, className: "pm-tag" }, tag);
						})) : null
					),
					R("div", { className: "pm-actions" },
						R("button", {
							type: "button", className: "pm-icon-btn", onClick: function () { props.onFavorite(prompt); },
							"aria-pressed": prompt.favorite,
							"aria-label": prompt.favorite ? t("unfavorite") : t("favorite"),
							title: prompt.favorite ? t("unfavorite") : t("favorite")
						}, prompt.favorite ? "★" : "☆"),
						R("button", {
							type: "button", className: "pm-icon-btn", "data-flash": props.flash === prompt.id ? "1" : "0",
							onClick: function () { props.onCopy(prompt); }
						}, props.flash === prompt.id ? t("copied") : t("copy")),
						R("button", { type: "button", className: "pm-icon-btn", onClick: function () { props.onEdit(prompt); } }, t("edit")),
						R("button", {
							type: "button", className: "pm-icon-btn", "data-danger": "1", onClick: function () { props.onDelete(prompt); }
						}, deleting ? t("confirmRemove") : t("remove"))
					)
				),
				R("div", { className: "pm-excerpt" }, prompt.content)
			);
		}

		function PromptEditor(props) {
			var initial = props.initial || null;
			var titleState = React.useState(initial ? initial.title : "");
			var contentState = React.useState(initial ? initial.content : "");
			var tagsState = React.useState(initial ? initial.tags.join(", ") : "");
			var errorState = React.useState("");
			var title = titleState[0], setTitle = titleState[1];
			var content = contentState[0], setContent = contentState[1];
			var tags = tagsState[0], setTags = tagsState[1];
			var error = errorState[0], setError = errorState[1];
			function submit() {
				var cleanTitle = title.trim();
				var cleanContent = content.trim();
				if (!cleanTitle) { setError(t("titleRequired")); return; }
				if (!cleanContent) { setError(t("contentRequired")); return; }
				props.onSave({ title: cleanTitle, content: cleanContent, tags: normalizeTags(tags) });
			}
			return R("div", { className: "pm-form" },
				R("div", { className: "pm-header" },
					R("div", { className: "pm-title" }, initial ? t("editTitle") : t("createTitle")),
					R("div", { className: "pm-hint" }, t("editorHint"))
				),
				R("div", { className: "pm-field" },
					R("label", { className: "pm-label", htmlFor: "pm-title-input" }, t("fieldTitle")),
					R("input", {
						id: "pm-title-input", className: "pm-input", type: "text", maxLength: MAX_TITLE_LENGTH,
						placeholder: t("fieldTitlePlaceholder"), value: title, autoFocus: true,
						onChange: function (event) { setTitle(event.target.value); setError(""); }
					})
				),
				R("div", { className: "pm-field" },
					R("label", { className: "pm-label", htmlFor: "pm-tags-input" }, t("fieldTags")),
					R("input", {
						id: "pm-tags-input", className: "pm-input", type: "text", maxLength: MAX_TAGS * (MAX_TAG_LENGTH + 2),
						placeholder: t("fieldTagsPlaceholder"), value: tags,
						onChange: function (event) { setTags(event.target.value); }
					})
				),
				R("div", { className: "pm-field" },
					R("div", { className: "pm-field-head" },
						R("label", { className: "pm-label", htmlFor: "pm-content-input" }, t("fieldContent")),
						R("span", { className: "pm-counter" }, t("characters", { count: content.length, max: MAX_CONTENT_LENGTH }))
					),
					R("textarea", {
						id: "pm-content-input", className: "pm-textarea", maxLength: MAX_CONTENT_LENGTH,
						placeholder: t("fieldContentPlaceholder"), value: content,
						onChange: function (event) { setContent(event.target.value); setError(""); },
						onKeyDown: function (event) {
							if ((event.ctrlKey || event.metaKey) && event.key === "Enter") { event.preventDefault(); submit(); }
						}
					})
				),
				error ? R(Notice, { text: error, error: true }) : null,
				R("div", { className: "pm-form-actions" },
					R("button", { type: "button", className: "pm-button", "data-primary": "1", onClick: submit }, t("save")),
					R("button", { type: "button", className: "pm-button", onClick: props.onCancel }, t("cancel"))
				)
			);
		}

		function PromptSection(props) {
			React.useSyncExternalStore(subscribeLocale, localeSnapshot);
			var data = React.useSyncExternalStore(subscribe, snapshot);
			var viewState = React.useState("list");
			var editingState = React.useState(null);
			var searchState = React.useState("");
			var flashState = React.useState("");
			var confirmState = React.useState("");
			var noticeState = React.useState(null);
			var importState = React.useState(null);
			var fileRef = React.useRef(null);
			var view = viewState[0], setView = viewState[1];
			var editing = editingState[0], setEditing = editingState[1];
			var search = searchState[0], setSearch = searchState[1];
			var flash = flashState[0], setFlash = flashState[1];
			var confirm = confirmState[0], setConfirm = confirmState[1];
			var notice = noticeState[0], setNotice = noticeState[1];
			var importPreview = importState[0], setImportPreview = importState[1];
			var prompts = data.prompts;
			var filtered = rankPrompts(prompts, search);

			if (view === "edit") {
				return R("div", { className: "pm-section" },
					R(PromptEditor, {
						initial: editing,
						onSave: function (fields) {
							if (editing) updatePrompt(editing.id, fields); else addPrompt(fields);
							setEditing(null); setView("list");
						},
						onCancel: function () { setEditing(null); setView("list"); }
					})
				);
			}

			function onImportFile(event) {
				var file = event.target.files && event.target.files[0];
				event.target.value = "";
				if (!file) return;
				var reader = new FileReader();
				reader.onload = function () {
					var parsed = parseImportText(reader.result);
					if (!parsed.ok) { setNotice({ text: t("importInvalid"), error: true }); return; }
					setImportPreview(parsed); setNotice(null);
				};
				reader.onerror = function () { setNotice({ text: t("importReadFailed"), error: true }); };
				reader.readAsText(file);
			}
			function finishImport(mode) {
				var next = mode === "merge" ? mergePromptSets(prompts, importPreview.prompts) : importPreview.prompts;
				persist(next);
				setNotice({ text: t(mode === "merge" ? "importMerged" : "importReplaced", { count: importPreview.prompts.length }), error: false });
				setImportPreview(null);
			}

			return R("div", { className: "pm-section" },
				R("div", { className: "pm-header" },
					R("div", { className: "pm-title" }, t("title")),
					R("div", { className: "pm-hint" }, t("subtitle"))
				),
				data.storageError ? R(Notice, { text: t(data.storageError), error: true }) : null,
				notice ? R(Notice, { text: notice.text, error: notice.error, onDismiss: function () { setNotice(null); } }) : null,
				importPreview ? R("div", { className: "pm-import", role: "region", "aria-label": t("importTitle") },
					R("div", { className: "pm-import-title" }, t("importTitle")),
					R("div", { className: "pm-hint" }, t("importSummary", { count: importPreview.prompts.length })),
					importPreview.skipped ? R("div", { className: "pm-hint" }, t("importSkipped", { count: importPreview.skipped })) : null,
					R("div", { className: "pm-form-actions" },
						R("button", { type: "button", className: "pm-button", "data-primary": "1", onClick: function () { finishImport("merge"); } }, t("merge")),
						R("button", { type: "button", className: "pm-button", "data-danger": "1", onClick: function () { finishImport("replace"); } }, t("replace")),
						R("button", { type: "button", className: "pm-button", onClick: function () { setImportPreview(null); } }, t("cancel"))
					)
				) : null,
				R("div", { className: "pm-toolbar" },
					R("input", {
						className: "pm-search", type: "search", placeholder: t("search"), "aria-label": t("searchLabel"), value: search,
						onChange: function (event) { setSearch(event.target.value); setConfirm(""); }
					}),
					R("button", { type: "button", className: "pm-button", "data-primary": "1", onClick: function () { setEditing(null); setView("edit"); } }, t("newPrompt")),
					R("button", { type: "button", className: "pm-button", onClick: function () { if (fileRef.current) fileRef.current.click(); } }, t("importPrompts")),
					R("button", { type: "button", className: "pm-button", onClick: function () {
						var ok = downloadBackup(prompts);
						setNotice({ text: t(ok ? "exportSuccess" : "exportFailed"), error: !ok });
					} }, t("exportPrompts")),
					R("input", { ref: fileRef, hidden: true, type: "file", accept: "application/json,.json", tabIndex: -1, onChange: onImportFile })
				),
				R("div", { className: "pm-status", "aria-live": "polite" },
					t("allCount", { count: prompts.length }), search.trim() ? t("matchCount", { count: filtered.length }) : ""
				),
				filtered.length ? R("div", { className: "pm-list" }, filtered.map(function (prompt) {
					return R(PromptCard, {
						key: prompt.id, prompt: prompt, flash: flash, confirm: confirm,
						onFavorite: function (target) { toggleFavorite(target.id); },
						onCopy: function (target) {
							copyText(target.content).then(function (ok) {
								if (!ok) { setNotice({ text: t("copyFailed"), error: true }); return; }
								setFlash(target.id); window.setTimeout(function () { setFlash(""); }, 1500);
							});
						},
						onEdit: function (target) { setEditing(target); setView("edit"); },
						onDelete: function (target) {
							if (confirm !== target.id) { setConfirm(target.id); window.setTimeout(function () { setConfirm(""); }, 3500); return; }
							setConfirm(""); removePrompt(target.id);
						}
					});
				})) : R("div", { className: "pm-empty" }, prompts.length ? t("noMatch") : t("empty")),
			);
		}

		var SafeSection = (function (Base) {
			function SafeSectionClass(props) {
				var self = Base.call(this, props) || this;
				self.state = { error: null };
				return self;
			}
			if (Object.setPrototypeOf) { Object.setPrototypeOf(SafeSectionClass, Base); Object.setPrototypeOf(SafeSectionClass.prototype, Base.prototype); }
			else { SafeSectionClass.prototype.__proto__ = Base.prototype; }
			SafeSectionClass.getDerivedStateFromError = function (error) { return { error: error }; };
			SafeSectionClass.prototype.render = function () {
				if (this.state.error) return R("div", { className: "pm-section" }, R(Notice, {
					text: t("loadFailed", { message: this.state.error && this.state.error.message ? this.state.error.message : String(this.state.error) }), error: true
				}));
				return R(PromptSection, this.props);
			};
			return SafeSectionClass;
		})(React.Component);

		function makeSlashSource(name) {
			return {
				trigger: "/",
				name: name,
				order: 200,
				candidates: function (projection, request) {
					var query = stripPromptAlias(request && request.query);
					var list = rankPrompts(allPrompts(), query).slice(0, MAX_CANDIDATES).map(function (prompt) {
						return { name: prompt.title, description: promptDescription(prompt), prompt: prompt };
					});
					return Promise.resolve(list);
				},
				onPick: function (request) {
					var prompt = request && request.candidate && request.candidate.prompt;
					if (!prompt || !prompt.content) return undefined;
					var sessionId = request && request.session && request.session.sessionId;
					if (!sessionId) return undefined;
					activateSessionPrompt(sessionId, prompt);
					return { text: "" };
				}
			};
		}

		if (window.__DSH_PROMPT_MANAGER_TEST_HOOK__) {
			window.__DSH_PROMPT_MANAGER_TEST_HOOK__({
				normalizeTags: normalizeTags,
				sanitizePrompts: sanitizePrompts,
				parseImportText: parseImportText,
				mergePromptSets: mergePromptSets,
				rankPrompts: rankPrompts,
				stripPromptAlias: stripPromptAlias,
				promptDescription: promptDescription,
				exportDocument: exportDocument,
				sanitizeInjectionRecord: sanitizeInjectionRecord,
				messages: messages
			});
		}

		return {
			inject: ["slots", "inputTriggers", "locale"],
			apply: function (ctx) {
				var styleElement = null;
				var localeRegistration = null;
				var localeUnsubscribe = null;
				try {
					localeRegistration = ctx.locale.register(LOCALE_NS, { zh: messages.zh, en: messages.en });
					boundTranslate = ctx.locale.bind(LOCALE_NS);
					var localeValue = ctx.locale.getSnapshot();
					setActiveLocale(localeValue && (localeValue.active || localeValue.locale || localeValue.language || localeValue));
					localeUnsubscribe = ctx.locale.subscribe(function () {
						var value = ctx.locale.getSnapshot();
						setActiveLocale(value && (value.active || value.locale || value.language || value));
					});
				} catch (error) { boundTranslate = null; }

				initializeStore();
				initializeInjectionStore();
				try {
					styleElement = document.createElement("style");
					styleElement.setAttribute("data-dsh-prompt-manager", "");
					styleElement.textContent = css;
					document.head.appendChild(styleElement);
				} catch (error) { styleElement = null; }

				try {
					ctx.slots.inject("settings.section", function () {
						return ctx.slots.register({
							name: "settings.section", id: "prompts", order: 120, locale: LOCALE_NS,
							label: function () { return t("manager"); }
						}, SafeSection);
					});
				} catch (error) { console.error("[dsh-prompt-manager] settings section:", error); }

				try {
					ctx.slots.inject("conversation.input.left", function () {
						return ctx.slots.register({
							name: "conversation.input.left", id: "prompt-manager-control", order: 50, locale: LOCALE_NS,
							label: function () { return t("promptControl"); }
						}, PromptControl);
					});
				} catch (error) { console.error("[dsh-prompt-manager] composer control:", error); }

				try {
					ctx.inject(["inputTriggers"], function (scope) {
						try {
							ctx.effect(function () {
								var unregister = scope.inputTriggers.registerSource(makeSlashSource("prompt"));
								return function () { unregister(); };
							});
						} catch (error) { console.error("[dsh-prompt-manager] slash sources:", error); }
					});
				} catch (error) { console.error("[dsh-prompt-manager] input trigger injection:", error); }

				try {
					ctx.effect(function () {
						function onStorage(event) {
							if (!event) return;
							if (event.key === STORAGE_KEY) reloadFromStorage();
							if (event.key === INJECTION_STORAGE_KEY) reloadInjectionsFromStorage();
						}
						window.addEventListener("storage", onStorage);
						return function () {
							window.removeEventListener("storage", onStorage);
							if (localeUnsubscribe) localeUnsubscribe();
							if (localeRegistration) localeRegistration();
							if (styleElement && styleElement.parentNode) styleElement.parentNode.removeChild(styleElement);
						};
					});
				} catch (error) {}
			}
		};
	}
});
