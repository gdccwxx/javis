import'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/demo_data.dart';
import '../design/tokens.dart';
import '../models/workspace_models.dart';
import '../shell/view_scaffold.dart';
import '../state/workbench_providers.dart';
import '../widgets/common.dart';

/// P8 Git 变更页。对应原型 `#view-git`。
class GitView extends ConsumerStatefulWidget {
  const GitView({super.key});

  @override
  ConsumerState<GitView> createState() => _GitViewState();
}

class _GitViewState extends ConsumerState<GitView> {
  late final TextEditingController _commitController;

  @override
  void initState() {
    super.initState();
    _commitController = TextEditingController(
      text: ref.read(commitMessageProvider),
    );
  }

  @override
  void dispose() {
    _commitController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    const git = DemoData.gitStatus;
    final staged = ref.watch(stagedFilesProvider);

    return ViewScaffold(
      header: ViewHeader(
        title: 'Git 变更',
        subtitle: '${git.branch} · 本地工作区 · 最后提交于 ${git.lastCommitAt}',
        actions: const [GhostButton(label: '提交历史')],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const _GitSummary(git),
            const SizedBox(height: 18),
            _DiffList(diffs: git.diffs, staged: staged),
            const SizedBox(height: 16),
            _CommitBox(
              controller: _commitController,
              stagedCount: staged.length,
            ),
          ],
        ),
      ),
    );
  }
}

class _GitSummary extends StatelessWidget {
  const _GitSummary(this.git);

  final GitWorkspaceStatus git;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _Metric(
          value: git.changedFiles.toString(),
          label: '已修改文件',
        ),
        const SizedBox(width: 10),
        _Metric(
          value: '+${git.totalAdded}',
          label: '新增行',
          color: AppColors.plus,
        ),
        const SizedBox(width: 10),
        _Metric(
          value: '-${git.totalRemoved}',
          label: '删除行',
          color: AppColors.minus,
        ),
      ],
    );
  }
}

class _Metric extends StatelessWidget {
  const _Metric({required this.value, required this.label, this.color});

  final String value;
  final String label;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(13),
        decoration: BoxDecoration(
          color: AppColors.panel,
          borderRadius: BorderRadius.circular(AppRadius.sm + 2),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              value,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: color ?? AppColors.text,
              ),
            ),
            const SizedBox(height: 3),
            Text(label, style: AppText.micro),
          ],
        ),
      ),
    );
  }
}

class _DiffList extends ConsumerWidget {
  const _DiffList({required this.diffs, required this.staged});

  final List<DiffEntry> diffs;
  final Set<String> staged;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.line),
        borderRadius: BorderRadius.circular(10),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          for (var i = 0; i < diffs.length; i++)
            _DiffRow(
              entry: diffs[i],
              isLast: i == diffs.length - 1,
              checked: staged.contains(diffs[i].path),
              onToggle: () => ref
                  .read(stagedFilesProvider.notifier)
                  .toggle(diffs[i].path),
            ),
        ],
      ),
    );
  }
}

class _DiffRow extends StatelessWidget {
  const _DiffRow({
    required this.entry,
    required this.isLast,
    required this.checked,
    required this.onToggle,
  });

  final DiffEntry entry;
  final bool isLast;
  final bool checked;
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        border: isLast
            ? null
            : const Border(bottom: BorderSide(color: AppColors.line)),
      ),
      child: Row(
        children: [
          _Checkbox(checked: checked, onTap: onToggle),
          const SizedBox(width: 10),
          FileTypeBadge(entry.kind.label),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              entry.path,
              style: const TextStyle(fontSize: 11, color: AppColors.text),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          SizedBox(
            width: 90,
            child: Row(
              children: [
                Text(
                  '+${entry.added}',
                  style: const TextStyle(fontSize: 11, color: AppColors.plus),
                ),
                const SizedBox(width: 12),
                Text(
                  '-${entry.removed}',
                  style: const TextStyle(fontSize: 11, color: AppColors.minus),
                ),
              ],
            ),
          ),
          const GhostButton(label: '查看 diff'),
        ],
      ),
    );
  }
}

/// 自绘勾选框，避免 Material Checkbox 自带的 padding 和涟漪破坏行高。
class _Checkbox extends StatelessWidget {
  const _Checkbox({required this.checked, required this.onTap});

  final bool checked;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      cursor: SystemMouseCursors.click,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          height: 14,
          width: 14,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: checked ? AppColors.violet : AppColors.surface,
            border: Border.all(
              color: checked ? AppColors.violet : AppColors.lineStrong,
            ),
            borderRadius: BorderRadius.circular(3),
          ),
          child: checked
              ? const Icon(Icons.check, size: 10, color: Colors.white)
              : null,
        ),
      ),
    );
  }
}

class _CommitBox extends StatelessWidget {
  const _CommitBox({required this.controller, required this.stagedCount});

  final TextEditingController controller;
  final int stagedCount;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.sidebarBg,
        border: Border.all(color: AppColors.line),
        borderRadius: BorderRadius.circular(AppRadius.lg),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            '创建本地提交',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AppColors.text,
            ),
          ),
          const SizedBox(height: 8),
          PlainTextField(hint: '填写提交说明', controller: controller),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '已选择 $stagedCount 个文件',
                style: AppText.caption,
              ),
              PrimaryButton(
                label: '提交变更',
                onPressed: stagedCount == 0 ? null : () {},
              ),
            ],
          ),
        ],
      ),
    );
  }
}
