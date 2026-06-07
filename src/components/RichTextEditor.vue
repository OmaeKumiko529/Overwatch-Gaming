<template>
  <div class="rich-text-editor">
    <div v-if="showToolbar" class="editor-toolbar">
      <button type="button" @click="editor.chain().focus().toggleBold().run()" :class="{ 'is-active': editor?.isActive('bold') }" title="加粗"><span class="toolbar-icon">B</span></button>
      <button type="button" @click="editor.chain().focus().toggleItalic().run()" :class="{ 'is-active': editor?.isActive('italic') }" title="斜体"><span class="toolbar-icon">I</span></button>
      <button type="button" @click="editor.chain().focus().toggleStrike().run()" :class="{ 'is-active': editor?.isActive('strike') }" title="删除线"><span class="toolbar-icon">S</span></button>
      <div class="toolbar-divider"></div>
      <button type="button" @click="editor.chain().focus().toggleHeading({ level: 1 }).run()" :class="{ 'is-active': editor?.isActive('heading', { level: 1 }) }" title="标题1"><span class="toolbar-icon">H1</span></button>
      <button type="button" @click="editor.chain().focus().toggleHeading({ level: 2 }).run()" :class="{ 'is-active': editor?.isActive('heading', { level: 2 }) }" title="标题2"><span class="toolbar-icon">H2</span></button>
      <button type="button" @click="editor.chain().focus().toggleHeading({ level: 3 }).run()" :class="{ 'is-active': editor?.isActive('heading', { level: 3 }) }" title="标题3"><span class="toolbar-icon">H3</span></button>
      <div class="toolbar-divider"></div>
      <button type="button" @click="editor.chain().focus().toggleBulletList().run()" :class="{ 'is-active': editor?.isActive('bulletList') }" title="无序列表"><span class="toolbar-icon">•</span></button>
      <button type="button" @click="editor.chain().focus().toggleOrderedList().run()" :class="{ 'is-active': editor?.isActive('orderedList') }" title="有序列表"><span class="toolbar-icon">1.</span></button>
      <button type="button" @click="editor.chain().focus().toggleBlockquote().run()" :class="{ 'is-active': editor?.isActive('blockquote') }" title="引用"><span class="toolbar-icon">❝</span></button>
      <div class="toolbar-divider"></div>
      <button type="button" @click="editor.chain().focus().setHorizontalRule().run()" title="水平线"><span class="toolbar-icon">―</span></button>
      <button type="button" @click="editor.chain().focus().setHardBreak().run()" title="换行"><span class="toolbar-icon">↵</span></button>
      <button type="button" @click="editor.chain().focus().undo().run()" title="撤销"><span class="toolbar-icon">↶</span></button>
      <button type="button" @click="editor.chain().focus().redo().run()" title="重做"><span class="toolbar-icon">↷</span></button>
      <div class="toolbar-divider"></div>
      <button type="button" @click="insertMention" title="提及用户" class="mention-button"><span class="toolbar-icon">@</span></button>
      <div class="toolbar-divider"></div>
      <button type="button" @click="insertBilibili" title="插入B站视频" class="bilibili-button"><span class="toolbar-icon">B</span></button>
      <button type="button" @click="insertGit" title="插入仓库引用" class="git-button"><span class="toolbar-icon">Git</span></button>
    </div>

    <div class="editor-content" ref="editorRef"></div>

    <Teleport to="body">
      <div v-if="showBilibiliModal" class="bilibili-modal-overlay" @click.self="cancelBilibili">
        <div class="bilibili-modal">
          <h3 class="bilibili-modal-title">插入B站视频</h3>
          <p class="bilibili-modal-desc">请输入B站视频BV号或完整链接</p>
          <input ref="bilibiliInputRef" v-model="bilibiliInput" type="text" class="bilibili-modal-input" placeholder="例如：BV1NArXB4E5q" @keydown.enter="confirmBilibili" @keydown.escape="cancelBilibili" />
          <div class="bilibili-modal-actions">
            <button class="bilibili-modal-cancel" @click="cancelBilibili">取消</button>
            <button class="bilibili-modal-confirm" @click="confirmBilibili">插入视频</button>
          </div>
          <p v-if="bilibiliError" class="bilibili-modal-error">{{ bilibiliError }}</p>
        </div>
      </div>

      <div v-if="showGitModal" class="git-modal-overlay" @click.self="cancelGit">
        <div class="git-modal">
          <h3 class="git-modal-title">插入仓库引用</h3>
          <p class="git-modal-desc">请输入 GitHub 或 Gitee 仓库链接</p>
          <input ref="gitInputRef" v-model="gitInput" type="text" class="git-modal-input" placeholder="例如：https://github.com/FishMoies/Overwatch-Gaming" @keydown.enter="confirmGit" @keydown.escape="cancelGit" :disabled="gitLoading" />
          <div v-if="gitLoading" class="git-modal-loading">
            <span class="git-loading-spinner"></span>
            <span>正在获取仓库信息...</span>
          </div>
          <div class="git-modal-actions">
            <button class="git-modal-cancel" @click="cancelGit" :disabled="gitLoading">取消</button>
            <button class="git-modal-confirm" @click="confirmGit" :disabled="gitLoading">插入仓库</button>
          </div>
          <p v-if="gitError" class="git-modal-error">{{ gitError }}</p>
        </div>
      </div>
    </Teleport>

    <div v-if="showCharCount" class="char-count">{{ charCount }}/{{ maxLength }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import { Editor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { UserMention, createSimpleMentionSuggestion } from './MentionExtension.js'
import { BilibiliNode } from './BilibiliNode.js'
import { GitNode } from './GitNode.js'
import userService from '../services/user.js'
import { gitApi } from '../services/api.js'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '请输入内容...' },
  showToolbar: { type: Boolean, default: true },
  showCharCount: { type: Boolean, default: true },
  maxLength: { type: Number, default: 5000 },
  editable: { type: Boolean, default: true },
  enableMention: { type: Boolean, default: true }
})

const emit = defineEmits(['update:modelValue', 'change', 'mention'])
const editorRef = ref(null)
const editor = ref(null)
const charCount = computed(() => editor.value ? editor.value.getText().length : 0)

// Bilibili modal state
const showBilibiliModal = ref(false)
const bilibiliInput = ref('')
const bilibiliError = ref('')
const bilibiliInputRef = ref(null)

// Git modal state
const showGitModal = ref(false)
const gitInput = ref('')
const gitError = ref('')
const gitLoading = ref(false)
const gitInputRef = ref(null)

const searchUsers = (query) => {
  if (!query || query.trim() === '') return userService.searchUsers('').slice(0, 5)
  return userService.searchUsers(query)
}

const mentionSuggestion = createSimpleMentionSuggestion(searchUsers)

onMounted(async () => {
  await userService.refreshUsers()
  setTimeout(async () => {
    if (userService.searchUsers('').length === 0) await userService.refreshUsers()
  }, 2000)
})

const initEditor = () => {
  if (!editorRef.value) return
  const extensions = [StarterKit.configure({ heading: { levels: [1, 2, 3] } }), BilibiliNode, GitNode]
  if (props.enableMention) {
    extensions.push(UserMention.configure({ HTMLAttributes: { class: 'user-mention' }, suggestion: mentionSuggestion }))
  }
  editor.value = new Editor({
    element: editorRef.value,
    extensions,
    content: props.modelValue,
    editable: props.editable,
    autofocus: false,
    onUpdate: () => { const html = editor.value.getHTML(); emit('update:modelValue', html); emit('change', html) },
    editorProps: { attributes: { class: 'tiptap-editor', placeholder: props.placeholder } }
  })
}

const insertMention = () => { if (editor.value) editor.value.chain().focus().insertContent('@').run() }

const insertBilibili = () => {
  bilibiliInput.value = ''; bilibiliError.value = ''; showBilibiliModal.value = true
  setTimeout(() => bilibiliInputRef.value?.focus(), 50)
}
const confirmBilibili = () => {
  if (!editor.value) return
  const trimmed = bilibiliInput.value.trim()
  if (!trimmed) { bilibiliError.value = '请输入BV号或链接'; return }
  const match = trimmed.match(/BV[a-zA-Z0-9]{10}/)
  if (!match || !/^BV[a-zA-Z0-9]{10}$/.test(match[0])) { bilibiliError.value = '无效的BV号'; return }
  editor.value.chain().focus().insertBilibili(match[0]).run()
  showBilibiliModal.value = false; bilibiliInput.value = ''; bilibiliError.value = ''
}
const cancelBilibili = () => { showBilibiliModal.value = false; bilibiliInput.value = ''; bilibiliError.value = '' }

// Git 仓库引用
const insertGit = () => {
  gitInput.value = ''; gitError.value = ''; gitLoading.value = false; showGitModal.value = true
  nextTick(() => gitInputRef.value?.focus())
}

const confirmGit = async () => {
  if (!editor.value) return
  const trimmed = gitInput.value.trim()
  if (!trimmed) { gitError.value = '请输入仓库链接'; return }

  // 验证链接格式
  const isValid = /(?:https?:\/\/)?(?:github\.com|gitee\.com)\/[^/\s?#]+\/[^/\s?#]+/.test(trimmed)
  if (!isValid) { gitError.value = '无效的仓库链接，仅支持 GitHub 和 Gitee'; return }

  gitLoading.value = true
  gitError.value = ''

  try {
    const res = await gitApi.fetchRepoInfo(trimmed)
    if (!res.success) {
      gitError.value = res.message || '获取仓库信息失败'
      return
    }

    const { title, url, platform, contributors } = res.data

    editor.value.chain().focus().insertGit({
      url,
      platform,
      title,
      contributors: JSON.stringify(contributors)
    }).run()

    showGitModal.value = false
    gitInput.value = ''
    gitError.value = ''
  } catch (e) {
    gitError.value = '网络错误，请稍后重试'
  } finally {
    gitLoading.value = false
  }
}

const cancelGit = () => {
  if (gitLoading.value) return
  showGitModal.value = false
  gitInput.value = ''
  gitError.value = ''
}

watch(() => props.modelValue, (nv) => { if (editor.value && editor.value.getHTML() !== nv) editor.value.commands.setContent(nv, false) })
watch(() => props.editable, (nv) => editor.value?.setEditable(nv))
watch(() => props.enableMention, () => { if (editor.value) { editor.value.destroy(); initEditor() } })

onMounted(() => initEditor())
onUnmounted(() => editor.value?.destroy())

defineExpose({
  editor, getHTML: () => editor.value?.getHTML(), getText: () => editor.value?.getText(),
  clear: () => editor.value?.commands.clearContent(), focus: () => editor.value?.commands.focus(),
  insertMention: (user) => { if (editor.value && user) editor.value.chain().focus().insertMention({ id: user.id, label: user.username, username: user.username }).run() }
})
</script>

<style>
.rich-text-editor {
  border: 2px solid #2a2a4a;
  border-radius: 10px;
  overflow: hidden;
  transition: border-color 0.3s ease;
  background: #0a0a18;
}
.rich-text-editor:focus-within {
  border-color: #4facfe;
  box-shadow: 0 0 0 3px rgba(79, 172, 254, 0.15);
}
.editor-toolbar {
  display: flex; flex-wrap: wrap; gap: 4px; padding: 10px;
  background: #1a1a2e; border-bottom: 1px solid #2a2a4a; align-items: center;
}
.editor-toolbar button {
  display: flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; border: 1px solid #2a2a4a; border-radius: 6px;
  background: #252545; color: #a0aec0; font-size: 14px; font-weight: 500;
  cursor: pointer; transition: all 0.2s ease;
}
.editor-toolbar button:hover { background: #3a3a6a; border-color: #4facfe; color: #e0e0e0; }
.editor-toolbar button.is-active { background: #4facfe; color: #ffffff; border-color: #4facfe; }
.editor-toolbar .mention-button:hover { background: #4facfe; color: white; border-color: #4facfe; }
.editor-toolbar .bilibili-button { background: #fb7299; color: white !important; border-color: #fb7299; width: 36px; font-weight: bold; }
.editor-toolbar .bilibili-button:hover { background: #f25d8c; }
.editor-toolbar .git-button { background: #2d8a4e; color: white !important; border-color: #2d8a4e; width: 36px; font-weight: bold; }
.editor-toolbar .git-button:hover { background: #36a85e; }
.toolbar-divider { width: 1px; height: 24px; background: #2a2a4a; margin: 0 4px; }
.toolbar-icon { font-family: 'SmileySans Oblique', sans-serif; font-weight: 600; }
.editor-content { min-height: 200px; max-height: 400px; overflow-y: auto; padding: 16px; }
.char-count { text-align: right; padding: 8px 16px; font-size: 0.9em; color: #a0aec0; border-top: 1px solid #2a2a4a; background: #1a1a2e; }

/* TipTap编辑器内部样式 */
.tiptap-editor { outline: none; min-height: 150px; }
.tiptap-editor p { margin: 0 0 1em 0; line-height: 1.6; color: #e0e0e0; }
.tiptap-editor h1 { font-size: 2em; font-weight: bold; margin: 1em 0 0.5em; line-height: 1.2; color: #e0e0e0; }
.tiptap-editor h2 { font-size: 1.5em; font-weight: bold; margin: 1em 0 0.5em; line-height: 1.3; color: #e0e0e0; }
.tiptap-editor h3 { font-size: 1.17em; font-weight: bold; margin: 1em 0 0.5em; line-height: 1.4; color: #e0e0e0; }
.tiptap-editor ul, .tiptap-editor ol { padding-left: 1.5em; margin: 1em 0; }
.tiptap-editor li { margin: 0.5em 0; }
.tiptap-editor blockquote { border-left: 3px solid #4facfe; margin: 1em 0; padding-left: 1em; color: #a0aec0; font-style: italic; }
.tiptap-editor hr { border: none; border-top: 2px solid #2a2a4a; margin: 2em 0; }
.tiptap-editor .is-empty::before { content: attr(data-placeholder); color: #6c757d; float: left; height: 0; pointer-events: none; }

/* Git 卡片 */
git-card.git-card {
  display: block;
  border: 1px solid #2d8a4e;
  border-radius: 8px;
  padding: 12px 16px;
  margin: 8px 0;
  background: #0d2818;
  cursor: pointer;
  transition: border-color 0.2s;
}
git-card.git-card:hover {
  border-color: #36a85e;
}
.git-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.git-platform-icon {
  font-size: 1.1em;
}
.git-card-title {
  font-weight: 600;
  color: #4ade80;
  font-size: 1em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.git-card-body {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}
.git-contributors {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}
.git-contributor-avatar {
  width: 22px !important;
  height: 22px !important;
  border-radius: 50%;
  object-fit: cover;
  display: inline-block;
  vertical-align: middle;
}
.git-contributor-name {
  font-size: 0.85em;
  color: #a0aec0;
  margin-right: 2px;
}
.git-contributor-more {
  font-size: 0.82em;
  color: #6c757d;
  margin-left: 2px;
}

/* 用户提及 */
.user-mention { background-color: #252545; color: #4facfe; padding: 2px 6px; border-radius: 4px; font-weight: 500; cursor: pointer; border: 1px solid #4facfe; }
.user-mention:hover { background-color: #3a3a6a; text-decoration: underline; }

/* B站 bv */
.bilibili-inline { background-color: #fb7299; color: white !important; padding: 2px 10px; border-radius: 4px; font-weight: 600; font-size: 0.9em; cursor: pointer; display: inline-block; white-space: nowrap; }

.tippy-box { max-width: none !important; }

.mention-suggestion-popup { display: inline-block; background: #1a1a2e; border: 1px solid #2a2a4a; border-radius: 8px; padding: 4px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.3); width: max-content; min-width: 160px; max-width: 400px; }
.mention-suggestion-list { list-style: none; margin: 0; padding: 0; }
.mention-suggestion-item { display: flex; align-items: center; padding: 6px 10px; cursor: pointer; gap: 8px; width: max-content; white-space: nowrap; }
.mention-suggestion-item:hover { background: #252545; }
.mention-suggestion-avatar { width: 24px !important; height: 24px !important; border-radius: 50%; flex-shrink: 0; object-fit: cover; }
.mention-suggestion-username { font-size: 14px; color: #e0e0e0; max-width: 220px; overflow: hidden; text-overflow: ellipsis; }
.mention-suggestion-userid { margin-left: auto; font-size: 12px; color: #6c757d; flex-shrink: 0; }

/* B站弹窗 */
.bilibili-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000; }
.bilibili-modal { background: #1a1a2e; border-radius: 16px; padding: 32px; width: 90%; max-width: 420px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); animation: modalSlideIn 0.2s ease; border: 1px solid #2a2a4a; }
@keyframes modalSlideIn { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
.bilibili-modal-title { font-family: 'SmileySans Oblique', sans-serif; font-size: 1.5rem; color: #e0e0e0; margin: 0 0 8px; }
.bilibili-modal-desc { font-family: 'MapleMono CN Regular', monospace; color: #a0aec0; font-size: 0.9rem; margin: 0 0 20px; }
.bilibili-modal-input { width: 100%; padding: 12px 16px; border: 2px solid #2a2a4a; border-radius: 10px; font-family: 'MapleMono CN Regular', monospace; font-size: 1rem; outline: none; transition: border-color 0.2s; box-sizing: border-box; background: #0a0a18; color: #e0e0e0; }
.bilibili-modal-input:focus { border-color: #fb7299; }
.bilibili-modal-actions { display: flex; gap: 12px; margin-top: 20px; justify-content: flex-end; }
.bilibili-modal-cancel { padding: 10px 24px; border: 2px solid #2a2a4a; border-radius: 8px; background: transparent; color: #a0aec0; font-family: 'MapleMono CN Regular', monospace; font-size: 0.95rem; cursor: pointer; transition: all 0.2s; }
.bilibili-modal-cancel:hover { background: #252545; border-color: #4facfe; color: #e0e0e0; }
.bilibili-modal-confirm { padding: 10px 24px; border: none; border-radius: 8px; background: #fb7299; color: white; font-family: 'MapleMono CN Regular', monospace; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.bilibili-modal-confirm:hover { background: #f25d8c; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(251,114,153,0.3); }
.bilibili-modal-error { color: #dc3545; font-size: 0.85rem; margin: 12px 0 0; font-family: 'MapleMono CN Regular', monospace; }

/* Git 弹窗 */
.git-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000; }
.git-modal { background: #1a1a2e; border-radius: 16px; padding: 32px; width: 90%; max-width: 480px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); animation: modalSlideIn 0.2s ease; border: 1px solid #2d8a4e; }
.git-modal-title { font-family: 'SmileySans Oblique', sans-serif; font-size: 1.5rem; color: #4ade80; margin: 0 0 8px; }
.git-modal-desc { font-family: 'MapleMono CN Regular', monospace; color: #a0aec0; font-size: 0.9rem; margin: 0 0 20px; }
.git-modal-input { width: 100%; padding: 12px 16px; border: 2px solid #2a2a4a; border-radius: 10px; font-family: 'MapleMono CN Regular', monospace; font-size: 1rem; outline: none; transition: border-color 0.2s; box-sizing: border-box; background: #0a0a18; color: #e0e0e0; }
.git-modal-input:focus { border-color: #2d8a4e; }
.git-modal-input:disabled { opacity: 0.6; }
.git-modal-loading { display: flex; align-items: center; gap: 8px; margin-top: 12px; color: #4ade80; font-size: 0.9rem; }
.git-loading-spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid #2d8a4e; border-top-color: transparent; border-radius: 50%; animation: gitSpinner 0.6s linear infinite; }
@keyframes gitSpinner { to { transform: rotate(360deg); } }
.git-modal-actions { display: flex; gap: 12px; margin-top: 20px; justify-content: flex-end; }
.git-modal-cancel { padding: 10px 24px; border: 2px solid #2a2a4a; border-radius: 8px; background: transparent; color: #a0aec0; font-family: 'MapleMono CN Regular', monospace; font-size: 0.95rem; cursor: pointer; transition: all 0.2s; }
.git-modal-cancel:hover { background: #252545; border-color: #4facfe; color: #e0e0e0; }
.git-modal-cancel:disabled { opacity: 0.5; cursor: not-allowed; }
.git-modal-confirm { padding: 10px 24px; border: none; border-radius: 8px; background: #2d8a4e; color: white; font-family: 'MapleMono CN Regular', monospace; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.git-modal-confirm:hover { background: #36a85e; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(45,138,78,0.3); }
.git-modal-confirm:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
.git-modal-error { color: #dc3545; font-size: 0.85rem; margin: 12px 0 0; font-family: 'MapleMono CN Regular', monospace; }

@media (max-width: 768px) {
  .editor-toolbar { gap: 2px; padding: 8px; }
  .editor-toolbar button { width: 32px; height: 32px; font-size: 12px; }
  .editor-content { padding: 12px; min-height: 150px; }
  .mention-suggestion-popup { min-width: 200px; max-width: 90vw; }
}
</style>