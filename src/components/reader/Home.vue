<template>
    <el-container direction="vertical">
        <titlebar backdrop shadow>
            <el-upload :auto-upload="false" accept=".epub" :on-change="selectFile" :multiple="false"
                :show-file-list="false">
                <el-button size="small" :icon="Plus" circle title="导入图书"></el-button>
            </el-upload>
        </titlebar>
        <!-- 书籍列表 -->
        <el-main class='main' ref="main">
            <div class="grid" ref="grid">
                <div v-for="(info, index) in bookList" :key="index">
                    <!-- 主体 -->
                    <el-card @click="readerBook(info)" ref="card" shadow="hover" class='box-card'
                        :body-style="{ padding: '0px' }">
                        <el-image :lazy="true" :src="'data:image/png;base64,' + info.coverBase64" fit='fill'
                            class='el-image'>
                            <template #error>
                                <div class="image-slot">
                                    <el-icon><icon-picture /></el-icon>
                                </div>
                            </template>
                        </el-image>
                        <!-- 提示 -->
                        <el-popover trigger="hover" placement='right'>
                            <template #reference>
                                <div class='title' :style="{
                                    background: info.bgColorFromCover
                                        ? info.bgColorFromCover
                                        : '#6d6d6d',
                                }">
                                    {{ trunc(info.title, 30) }}
                                </div>
                            </template>
                            <!-- 书籍信息 -->
                            <div>
                                <p> <el-button type="primary" round :icon="Download"
                                        @click="download(info.url)">下载</el-button></p>
                                <p>
                                    <el-button type="primary" round :icon="Delete" @click="delFile(info.id)">删除</el-button>
                                </p>
                                <el-divider />
                                <p v-if="info.creator">作者: {{ info.creator }}</p>
                                <p v-if="info.description">
                                    描述: <span :title="info.description"> {{ trunc(info.description, 30) }}</span>
                                </p>
                                <p v-if="info.publisher">出版社: {{ info.publisher }}</p>
                                <p v-if="info.date">出版日期: {{ publishDate(info.date) || publishDate(info.publishDate) }}</p>
                                <p v-if="info.language">语言: {{ info.language }}</p>
                                <p v-if="info.size">文件大小: {{ formatSize(info.size) }}</p>
                            </div>
                        </el-popover>
                    </el-card>
                </div>
            </div>
        </el-main>
    </el-container>
</template>
  
<script setup>
import { Plus, Download, Delete, Picture as IconPicture } from '@element-plus/icons-vue'
import titlebar from './Titlebar.vue'
import fileSaver from 'file-saver';
import { db } from "./utils/db"
import { getFileMD5 } from "./utils/md5"
import { useReaderStore } from './utils/stores'
import { ref, reactive, toRefs, onMounted, onBeforeUnmount } from "vue"

const reader = useReaderStore()

const bookList = reader.bookList.sort((a, b) => {
    if (a.lastOpen && b.lastOpen) {
        return b.lastOpen - a.lastOpen;
    }
    else {
        return 1
    }

})
console.log(bookList)

const { saveAs } = fileSaver;
const grid = ref(null)
const main = ref(null)
const data = reactive({
    maxColWidth: 280,
    gap: 32,
})
let items = []

const { maxColWidth, gap } = toRefs(data)
const props = defineProps({
    useMin: {
        type: Boolean,
        default: false
    },
    maxCols: {
        type: Number, // Maximum number of colums. Default: Infinite
        default: Infinity,
    }
})
const { useMin, maxCols } = props

onMounted(async () => {
    if (!bookList.length) return
    initStyle()
    positionItems()
    window.addEventListener("resize", resize);
})
onBeforeUnmount(() => {
    window.removeEventListener("resize", resize);
})
const trunc = (str, n) => {
    return str.length > n ? `${str.substr(0, n - 3)}...` : str
}
const publishDate = (val) => {
    const date = new Date(val);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDay();
    return `${year}-${month}-${day}`;
}
//style
const initStyle = () => {
    items = grid.value.children;
    if (items.length === 0) return;
    main.value.$el.style.position = "relative";
    Array.prototype.forEach.call(items, (item) => {
        item.style.position = "absolute";
        item.style.maxWidth = `${maxColWidth.value}px`;
        item.style.transition =
            "top 0.2s ease, left 0.2s ease, right 0.2s ease, buttom 0.2s ease";
    });
}
const positionItems = () => {
    if (items.length === 0) return;

    let { cols, wSpace } = setup();

    wSpace = Math.floor(wSpace / 2);

    Array.prototype.forEach.call(items, (item, i) => {
        const min = nextCol(cols, i);

        const left = min.index * colWidth() + wSpace;

        item.style.left = `${left}px`;
        item.style.top = `${min.height + min.top}px`;

        min.height += min.top + item.getBoundingClientRect().height;
        min.top = gap.value;
    });
    main.value.$el.style.height = `${getMax(cols).height}px`;
}
const nextCol = (cols, i) => {
    if (useMin) return getMin(cols);
    return cols[i % cols.length];
}
const colWidth = () => {
    let width = items[0].getBoundingClientRect().width + gap.value;
    return width;
}
const getMin = (cols) => {
    let min = cols[0];
    cols.forEach(col => {
        if (col.height < min.height) min = col;
    });
    return min;
}
const getMax = (cols) => {
    let max = cols[0];
    cols.forEach((col) => {
        if (col.height > max.height) max = col;
    });
    return max;
}
const setup = () => {
    const { width } = main.value.$el.getBoundingClientRect();
    let numCols = Math.floor(width / colWidth()) || 1;
    const cols = [];

    if (maxCols && numCols > maxCols) {
        numCols = maxCols;
    }

    for (let i = 0; i < numCols; i += 1) {
        cols[i] = {
            height: 0,
            top: 0,
            index: i,
        };
    }

    const wSpace = width - numCols * colWidth() + gap.value

    return {
        cols,
        wSpace,
    };
}
const resize = () => {
    setTimeout(positionItems(), 200);
}
//books info
const formatSize = (size) => {
    return size / 1024 / 1024 > 1 ? parseFloat(size / 1024 / 1024 + "").toFixed(2) + "Mb"
        : parseInt(size / 1024 + "") + "Kb"
}
const download = (url) => {
    saveAs("/books/" + url, url);
}
const emit = defineEmits(['update:currentBook'])
//reader
const readerBook = (info) => {
    emit('update:currentBook', info)
}
//导入
const selectFile = async (item) => {
    const { raw, name, size } = item
    // const md5 = await getFileMD5(raw)
    // const res = await db.books.get({ md5 })
    // if (res) return ElMessage.error('图书重复')
    // const reader = new FileReader()
    // reader.onerror = (error) => {
    //     console.log(error)
    // }
    // reader.onloadend = (e) => {
    //     const file = { buffer: reader.result, size, name, md5 }
    //     saveFile(file)
    // }
    // reader.readAsArrayBuffer(raw)
    //不存储
    const reader = new FileReader()
    reader.onerror = (error) => {
        console.log(error)
    }
    reader.onloadend = (e) => {
        console.log(reader)
        emit('update:currentBook', reader.result)
    }
    reader.readAsArrayBuffer(raw)
}
const saveFile = async (file) => {
    //保存文件
    const id = await db.books.add(file);
    emit('update:currentBook', id)
}
const delFile = (id) => {
    reader.delBook(id)
}

</script>
  
<style scoped lang="scss">
::-webkit-scrollbar {
    display: none;
}
.main {

    /* margin-top: 40px; */
    .grid {
        margin: 40px;

        .box-card {
            width: 170px;
            height: 250px;
            user-select: none;
            cursor: pointer;

            .el-image {
                height: 200px;
                width: 100%;

                .image-slot {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    width: 100%;
                    height: 100%;
                    background: var(--el-fill-color-light);
                    color: var(--el-text-color-secondary);
                    font-size: 30px;
                }
            }

            .title {
                width: 100%;
                height: 50px;
                font-size: 14px;
                display: inline-grid;
                align-content: center;
                text-align: center;
                color: #ffffff;
                position: relative;
                top: -3px;
            }
        }
    }
}
</style>
  