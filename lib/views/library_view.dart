import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/demo_data.dart';
import '../design/tokens.dart';
import '../models/workspace_models.dart';
import '../shell/view_scaffold.dart';
import '../state/workbench_providers.dart';
import '../widgets/common.dart';

/// P4 素材库。对应原型 `#view-library`。
class LibraryView extends ConsumerWidget {
  const LibraryView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final materials = ref.watch(filteredMaterialsProvider);

    return ViewScaffold(
      header: const ViewHeader(
        title: '用户素材库',
        subtitle: DemoData.materialsSubtitle,
        actions: [PrimaryButton(label: '导入素材')],
      ),
      body: LayoutBuilder(
        builder: (context, constraints) {
          // 原型：宽屏两列，窄屏单列。
          final columns =
              constraints.maxWidth < AppLayout.gridBreakpoint ? 1 : 2;
          return SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: PlainTextField(
                        hint: '搜索文件名、内容或标签',
                        onChanged: (v) => ref
                            .read(materialQueryProvider.notifier)
                            .state = v,
                      ),
                    ),
                    const SizedBox(width: 8),
                    const _FilterButton('所有类型'),
                    const SizedBox(width: 8),
                    const _FilterButton('最近导入'),
                  ],
                ),
                const SizedBox(height: 18),
                if (materials.isEmpty)
                  const _EmptyState()
                else
                  _MaterialGrid(materials: materials, columns: columns),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _FilterButton extends StatelessWidget {
  const _FilterButton(this.label);

  final String label;

  @override
  Widget build(BuildContext context) {
    return HoverHighlight(
      borderRadius: AppRadius.md,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 7),
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.lineStrong),
          borderRadius: BorderRadius.circular(AppRadius.md),
        ),
        child: Text(
          label,
          style: const TextStyle(fontSize: 11, color: Color(0xFF637083)),
        ),
      ),
    );
  }
}

/// 自适应列数的卡片网格。
///
/// 用 Wrap +计算宽度而不是 GridView，因为外层已经是滚动容器，
/// GridView 嵌套滚动会打乱滚动手势。
class _MaterialGrid extends StatelessWidget {
  const _MaterialGrid({required this.materials, required this.columns});

  final List<MaterialItem> materials;
  final int columns;

  @override
  Widget build(BuildContext context) {
    const gap = 12.0;
    return LayoutBuilder(
      builder: (context, constraints) {
        final itemWidth =
            (constraints.maxWidth - gap * (columns - 1)) / columns;
        return Wrap(
          spacing: gap,
          runSpacing: gap,
          children: [
            for (final m in materials)
              SizedBox(width: itemWidth, child: _MaterialCard(m)),
          ],
        );
      },
    );
  }
}

class _MaterialCard extends StatelessWidget {
  const _MaterialCard(this.item);

  final MaterialItem item;

  @override
  Widget build(BuildContext context) {
    return SurfaceCard(
      minHeight: 155,
      borderRadius: 10,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _KindBadge(item.kind),
              Text(
                item.size,
                style: const TextStyle(fontSize: 10, color: Color(0xFF99A2AD)),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Text(item.title, style: AppText.cardTitle),
          const SizedBox(height: 7),
          Text(
            item.description,
            style: const TextStyle(
              fontSize: 11,
              height: 1.55,
              color: AppColors.muted,
            ),
          ),
          const SizedBox(height: 13),
          Wrap(
            spacing: 5,
            runSpacing: 5,
            children: [
              for (final tag in item.tags)
                if (tag.highlighted)
                  Chip8.green(tag.label)
                else
                  Chip8(tag.label),
            ],
          ),
        ],
      ),
    );
  }
}

/// 文件类型角标。不同类型用不同配色，和原型一致。
class _KindBadge extends StatelessWidget {
  const _KindBadge(this.kind);

  final WorkspaceFileKind kind;

  @override
  Widget build(BuildContext context) {
    final (bg, fg) = switch (kind) {
      WorkspaceFileKind.pdf => (AppColors.violet50, AppColors.violet),
      WorkspaceFileKind.markdown => (AppColors.teal50, AppColors.teal),
      WorkspaceFileKind.text => (AppColors.amber50, AppColors.amber),
      WorkspaceFileKind.yaml => (AppColors.blue50, AppColors.blue),
      WorkspaceFileKind.json => (AppColors.blue50, AppColors.blue),
      WorkspaceFileKind.image => (AppColors.chipBg, AppColors.muted),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(AppRadius.xs),
      ),
      child: Text(
        kind.label,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: fg,
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 48),
      alignment: Alignment.center,
      child: Text('没有匹配的素材', style: AppText.caption),
    );
  }
}
