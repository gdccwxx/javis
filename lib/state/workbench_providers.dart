import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/demo_data.dart';
import '../models/workspace_models.dart';

/// 当前选中的主视图。侧边栏导航和主工作区共用这一状态。
final activeViewProvider = StateProvider<WorkbenchView>(
  (ref) => WorkbenchView.chat,
);

/// 桌面窗口装饰风格。只影响 AppBar 上的窗口按钮，不影响业务逻辑。
final platformStyleProvider = StateProvider<DesktopPlatformStyle>(
  (ref) => DesktopPlatformStyle.macOS,
);

/// 会话消息流。
final messagesProvider = StateNotifierProvider<MessagesNotifier, List<ChatMessage>>(
  (ref) => MessagesNotifier(DemoData.messages),
);

class MessagesNotifier extends StateNotifier<List<ChatMessage>> {
  MessagesNotifier(super.initial);

  var _seq = 0;

  /// 发送一条用户消息。
  ///
  /// 真实实现里这里会触发大副的意图理解和任务拆解；
  /// 当前只做本地追加，保证输入框链路是通的。
  void send(String text) {
    final trimmed = text.trim();
    if (trimmed.isEmpty) return;
    state = [
      ...state,
      ChatMessage(
        id: 'local-${_seq++}',
        author: MessageAuthor.user,
        text: trimmed,
      ),
    ];
  }
}

/// 知识工作区当前选中的文件名。
final selectedDocProvider = StateProvider<String>(
  (ref) => DemoData.selectedDocName,
);

/// 文件树筛选关键词。
final treeFilterProvider = StateProvider<String>((ref) => '');

/// 经过筛选后的文件树。文件夹节点始终保留，避免层级断裂。
final filteredTreeProvider = Provider<List<TreeNode>>((ref) {
  final keyword = ref.watch(treeFilterProvider).trim().toLowerCase();
  if (keyword.isEmpty) return DemoData.knowledgeTree;
  return DemoData.knowledgeTree
      .where((n) => n.isFolder || n.name.toLowerCase().contains(keyword))
      .toList();
});

/// 素材库搜索关键词。
final materialQueryProvider = StateProvider<String>((ref) => '');

final filteredMaterialsProvider = Provider<List<MaterialItem>>((ref) {
  final keyword = ref.watch(materialQueryProvider).trim().toLowerCase();
  if (keyword.isEmpty) return DemoData.materials;
  return DemoData.materials.where((m) {
    return m.title.toLowerCase().contains(keyword) ||
        m.description.toLowerCase().contains(keyword) ||
        m.tags.any((t) => t.label.toLowerCase().contains(keyword));
  }).toList();
});

/// Git 页面上已勾选待提交的文件路径集合。默认全选。
final stagedFilesProvider =
    StateNotifierProvider<StagedFilesNotifier, Set<String>>((ref) {
  return StagedFilesNotifier(
    DemoData.gitStatus.diffs.map((d) => d.path).toSet(),
  );
});

class StagedFilesNotifier extends StateNotifier<Set<String>> {
  StagedFilesNotifier(super.initial);

  void toggle(String path) {
    final next = {...state};
    if (!next.remove(path)) next.add(path);
    state = next;
  }
}

/// 提交说明输入内容。
final commitMessageProvider = StateProvider<String>(
  (ref) => DemoData.gitStatus.commitMessage,
);

/// Git 未提交变更数，供侧边栏角标使用。
final gitBadgeCountProvider = Provider<int>(
  (ref) => DemoData.gitStatus.changedFiles,
);
