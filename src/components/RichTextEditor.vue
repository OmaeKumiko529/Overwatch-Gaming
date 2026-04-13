<template>
  <div class="rich-text-editor">
    <!-- 工具栏 -->
    <div v-if="showToolbar" class="editor-toolbar">
      <button
        type="button"
        @click="editor.chain().focus().toggleBold().run()"
        :class="{ 'is-active': editor?.isActive('bold') }"
        title="加粗"
      >
        <span class="toolbar-icon">B</span>
      </button>
      <button
        type="button"
        @click="editor.chain().focus().toggleItalic().run()"
        :class="{ 'is-active': editor?.isActive('italic') }"
        title="斜体"
      >
        <span class="toolbar-icon">I</span>
      </button>
      <button
        type="button"
        @click="editor.chain().focus().toggleStrike().run()"
        :class="{ 'is-active': editor?.isActive('strike') }"
        title="删除线"
      >
        <span class="toolbar-icon">S</span>
      </button>
      <div class="toolbar-divider"></div>
      <button
        type="button"
        @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
        :class="{ 'is-active': editor?.isActive('heading', { level: 1 }) }"
        title="标题1"
      >
        <span class="toolbar-icon">H1</span>
      </button>
      <button
        type="button"
        @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
        :class="{ 'is-active': editor?.isActive('heading', { level: 2 }) }"
        title="标题2"
      >
        <span class="toolbar-icon">H2</span>
      </button>
      <button
        type="button"
        @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
        :class="{ 'is-active': editor?.isActive('heading', { level: 3 }) }"
        title="标题3"
      >
        <span class="toolbar-icon">H3</span>
      </button>
      <div class="toolbar-divider"></div>
      <button
        type="button"
        @click="editor.chain().focus().toggleBulletList().run()"
        :class="{ 'is-active': editor?.isActive('bulletList') }"
        title="无序列表"
      >
        <span class="toolbar-icon">•</span>
      </button>
      <button
        type="button"
        @click="editor.chain().focus().toggleOrderedList().run()"
        :class="{ 'is-active': editor?.isActive('orderedList') }"
        title="有序列表"
      >
        <span class="toolbar-icon">1.</span>
      </button>
      <button
        type="button"
        @click="editor.chain().focus().toggleBlockquote().run()"
        :class="{ 'is-active': editor?.isActive('blockquote') }"
        title="引用"
      >
        <span class="toolbar-icon">❝</span>
      </button>
      <div class="toolbar-divider"></div>
      <button
        type="button"
        @click="editor.chain().focus().setHorizontalRule().run()"
        title="水平线"
      >
        <span class="toolbar-icon">―</span>
      </button>
      <button
        type="button"
        @click="editor.chain().focus().setHardBreak().run()"
        title="换行"
      >
        <span class="toolbar-icon">↵</span>
      </button>
      <button
        type="button"
        @click="editor.chain().focus().undo().run()"
        title="撤销"
      >
        <span class="toolbar-icon">↶</span>
      </button>
      <button
        type="button"
        @click="editor.chain().focus().redo().run()"
        title="重做"
      >
        <span class="toolbar-icon">↷</span>
      </button>
    </div>

    <!-- 编辑器内容区域 -->
    <div class="editor-content" ref="editorRef"></div>

    <!-- 字符计数 -->
    <div v-if="showCharCount" class="char-count">
      {{ charCount }}/{{ maxLength }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { Editor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '请输入内容...'
  },
  showToolbar: {
    type: Boolean,
    default: true
  },
  showCharCount: {
    type: Boolean,
    default: true
  },
  maxLength: {
    type: Number,
    default: 5000
  },
  editable: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const editorRef = ref(null)
const editor = ref(null)

// 计算字符数
const charCount = computed(() => {
  if (!editor.value) return 0
  return editor.value.getText().length
})

// 初始化编辑器
const initEditor = () => {
  if (!editorRef.value) return

  editor.value = new Editor({
    element: editorRef.value,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        }
      })
    ],
    content: props.modelValue,
    editable: props.editable,
    autofocus: false,
    onUpdate: () => {
      const html = editor.value.getHTML()
      emit('update:modelValue', html)
      emit('change', html)
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
        placeholder: props.placeholder
      }
    }
  })
}

// 监听modelValue变化
watch(() => props.modelValue, (newValue) => {
  if (editor.value && editor.value.getHTML() !== newValue) {
    editor.value.commands.setContent(newValue, false)
  }
})

// 监听editable变化
watch(() => props.editable, (newValue) => {
  if (editor.value) {
    editor.value.setEditable(newValue)
  }
})

// 组件挂载时初始化编辑器
onMounted(() => {
  initEditor()
})

// 组件卸载时销毁编辑器
onUnmounted(() => {
  if (editor.value) {
    editor.value.destroy()
  }
})

// 暴露编辑器实例给父组件
defineExpose({
  editor,
  getHTML: () => editor.value?.getHTML(),
  getText: () => editor.value?.getText(),
  clear: () => editor.value?.commands.clearContent(),
  focus: () => editor.value?.commands.focus()
})
</script>

<style scoped>
.rich-text-editor {
  border: 2px solid #ddd;
  border-radius: 10px;
  overflow: hidden;
  transition: border-color 0.3s ease;
  background: white;
}

.rich-text-editor:focus-within {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 10px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  align-items: center;
}

.editor-toolbar button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  background: white;
  color: #495057;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.editor-toolbar button:hover {
  background: #e9ecef;
  border-color: #adb5bd;
}

.editor-toolbar button.is-active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: #dee2e6;
  margin: 0 4px;
}

.toolbar-icon {
  font-family: 'SmileySans Oblique', sans-serif;
  font-weight: 600;
}

.editor-content {
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;
  padding: 16px;
}

.char-count {
  text-align: right;
  padding: 8px 16px;
  font-size: 0.9em;
  color: #888;
  border-top: 1px solid #e9ecef;
  background: #f8f9fa;
}

/* TipTap编辑器内部样式 */
:deep(.tiptap-editor) {
  outline: none;
  min-height: 150px;
}

:deep(.tiptap-editor p) {
  margin: 0 0 1em 0;
  line-height: 1.6;
}

:deep(.tiptap-editor h1) {
  font-size: 2em;
  font-weight: bold;
  margin: 1em 0 0.5em 0;
  line-height: 1.2;
}

:deep(.tiptap-editor h2) {
  font-size: 1.5em;
  font-weight: bold;
  margin: 1em 0 0.5em 0;
  line-height: 1.3;
}

:deep(.tiptap-editor h3) {
  font-size: 1.17em;
  font-weight: bold;
  margin: 1em 0 0.5em 0;
  line-height: 1.4;
}

:deep(.tiptap-editor ul),
:deep(.tiptap-editor ol) {
  padding-left: 1.5em;
  margin: 1em 0;
}

:deep(.tiptap-editor li) {
  margin: 0.5em 0;
}

:deep(.tiptap-editor blockquote) {
  border-left: 3px solid #667eea;
  margin: 1em 0;
  padding-left: 1em;
  color: #666;
  font-style: italic;
}

:deep(.tiptap-editor hr) {
  border: none;
  border-top: 2px solid #e9ecef;
  margin: 2em 0;
}

:deep(.tiptap-editor .is-empty::before) {
  content: attr(data-placeholder);
  color: #adb5bd;
  float: left;
  height: 0;
  pointer-events: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .editor-toolbar {
    gap: 2px;
    padding: 8px;
  }
  
  .editor-toolbar button {
    width: 32px;
    height: 32px;
    font-size: 12px;
  }
  
  .editor-content {
    padding: 12px;
    min-height: 150px;
  }
}
</style>