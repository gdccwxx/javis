import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../design/tokens.dart';
import '../models/workspace_models.dart';
import '../state/workbench_providers.dart';
import '../views/agents_view.dart';
import '../views/chat_view.dart';
import '../views/git_view.dart';
import '../views/knowledge_view.dart';
import '../views/library_view.dart';
import '../views/models_view.dart';
import 'workbench_app_bar.dart';
import 'workbench_inspector.dart';
import 'workbench_sidebar.dart';

/// 应用主壳体。
///
/// 对应原型 `.app-shell` 的三列 grid：
/// `236px | minmax(540px, 1fr) | 300px`，顶部 appbar 横跨全部列。
///
/// 窄于 1050px 时隐藏右侧检查器、侧边栏收窄到 210px，
/// 和原型的媒体查询保持一致。
class WorkbenchShell extends ConsumerWidget {
  const WorkbenchShell({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final compact = constraints.maxWidth < AppLayout.inspectorBreakpoint;
        final sidebarWidth = compact
            ? AppLayout.sidebarWidthCompact
            : AppLayout.sidebarWidth;

        return DecoratedBox(
          decoration: const BoxDecoration(color: AppColors.surface),
          child: Column(
            children: [
              const WorkbenchAppBar(),
              Expanded(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    WorkbenchSidebar(width: sidebarWidth),
                    const Expanded(child: _MainArea()),
                    if (!compact) const WorkbenchInspector(),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

/// 中间主工作区。按当前选中的导航切换视图。
class _MainArea extends ConsumerWidget {
  const _MainArea();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final view = ref.watch(activeViewProvider);

    return ColoredBox(
      color: AppColors.surface,
      // 用 IndexedStack 而不是直接 switch 返回，
      // 这样各视图的滚动位置和输入内容在切换时不会丢。
      child: IndexedStack(
        index: WorkbenchView.values.indexOf(view),
        children: const [
          ChatView(),
          KnowledgeView(),
          LibraryView(),
          AgentsView(),
          ModelsView(),
          GitView(),
        ],
      ),
    );
  }
}
