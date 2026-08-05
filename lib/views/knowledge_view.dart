import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/demo_data.dart';
import '../design/tokens.dart';
import '../models/workspace_models.dart';
import '../shell/view_scaffold.dart';
import '../state/workbench_providers.dart';
import '../widgets/common.dart';

/// P3 知识工作区。对应原型 `#view-knowledge`。
///
/// 左侧文件树 + 中间文档正文；右侧元数据由全局检查器承担，
/// 所以这里只做两列，避免和Shell 的 inspector 重复。
class KnowledgeView extends ConsumerWidget {
  const KnowledgeView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ViewScaffold(
      header: const ViewHeader(
        title: '知识工作区',
        subtitle: 'Git 管理的上下文资料 · 所有变更可追溯',
        actions: [
          GhostButton(label: '查看 diff'),
          PrimaryButton(label: '编辑文件'),
        ],
      ),
      body: LayoutBuilder(
        builder: (context, constraints) {
          // 窄屏下文件树收窄到 200px，和原型的媒体查询一致。
          final treeWidth = constraints.maxWidth < AppLayout.inspectorBreakpoint
              ? 200.0
              : AppLayout.fileTreeWidth;
          return Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _FileTree(width: treeWidth),
              const Expanded(child: _DocPane()),
            ],
          );
        },
      ),
    );
  }
}

class _FileTree extends ConsumerWidget {
  const _FileTree({required this.width});

  final double width;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final nodes = ref.watch(filteredTreeProvider);
    final selected = ref.watch(selectedDocProvider);

    return Container(
      width: width,
      decoration: const BoxDecoration(
        color: AppColors.sidebarBg,
        border: Border(right: BorderSide(color: AppColors.line)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.all(14),
            child: PlainTextField(
              hint: '筛选文件',
              fontSize: 11,
              dense: true,
              onChanged: (v) =>
                  ref.read(treeFilterProvider.notifier).state = v,
            ),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
              children: [
                for (final node in nodes)
                  _TreeRow(
                    node: node,
                    selected: !node.isFolder && node.name == selected,
                    onTap: node.isFolder
                        ? null
                        : () => ref
                            .read(selectedDocProvider.notifier)
                            .state = node.name,
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TreeRow extends StatelessWidget {
  const _TreeRow({
    required this.node,
    required this.selected,
    this.onTap,
  });

  final TreeNode node;
  final bool selected;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    // `.tree-node.indent { padding-left: 23px }`
    final leftPad = node.depth > 0 ? 23.0 : 7.0;
    return HoverHighlight(
      onTap: onTap,
      enabled: !selected,
      borderRadius: 5,
      child: Container(
        padding: EdgeInsets.fromLTRB(leftPad, 5, 7, 5),
        decoration: BoxDecoration(
          color: selected ? AppColors.violet50 : Colors.transparent,
          borderRadius: BorderRadius.circular(5),
        ),
        child: Row(
          children: [
            SizedBox(
              width: 12,
              child: Text(
                node.isFolder ? '⌄' : '◇',
                style: const TextStyle(fontSize: 11, color: Color(0xFF9AA4B2)),
              ),
            ),
            const SizedBox(width: 6),
            Expanded(
              child: Text(
                node.name,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight:
                      node.isFolder ? FontWeight.w600 : FontWeight.w400,
                  color: selected
                      ? const Color(0xFF4D37B6)
                      : node.isFolder
                          ? const Color(0xFF3C4654)
                          : const Color(0xFF576476),
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DocPane extends StatelessWidget {
  const _DocPane();

  @override
  Widget build(BuildContext context) {
    const doc = DemoData.knowledgeDoc;

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 44, vertical: 30),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            doc.breadcrumb,
            style: const TextStyle(fontSize: 11, color: Color(0xFF8F99A7)),
          ),
          const SizedBox(height: 18),
          Text(
            doc.title,
            style: const TextStyle(
              fontSize: 23,
              fontWeight: FontWeight.w600,
              letterSpacing: -0.4,
              color: AppColors.text,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.only(bottom: 20),
            margin: const EdgeInsets.only(bottom: 22),
            decoration: const BoxDecoration(
              border: Border(bottom: BorderSide(color: AppColors.line)),
            ),
            child: Text(doc.meta, style: AppText.caption),
          ),
          CalloutBox(doc.callout),
          const _DocHeading('已确认原则'),
          for (final item in doc.principles) _BulletItem(item),
          const _DocHeading('关联文件'),
          Text(
            doc.relatedFiles.join(' · '),
            style: AppText.docBody.copyWith(
              fontFamily: 'SF Mono',
              fontFamilyFallback: AppFonts.mono,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}

class _DocHeading extends StatelessWidget {
  const _DocHeading(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 25, bottom: 8),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: AppColors.text,
        ),
      ),
    );
  }
}

class _BulletItem extends StatelessWidget {
  const _BulletItem(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 2),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.only(top: 6, right: 10),
            child: Dot(color: AppColors.soft, size: 4),
          ),
          Expanded(child: Text(text, style: AppText.docBody)),
        ],
      ),
    );
  }
}
