import 'package:flutter/material.dart';

import '../data/demo_data.dart';
import '../design/tokens.dart';
import '../models/workspace_models.dart';
import '../widgets/common.dart';

/// 右侧检查器。对应原型 `.inspector`，固定 300px 宽。
///
/// PRD 里明确要求任务看板作为「右侧检查器」常驻、不遮挡主对话，
/// 所以这里始终展示任务、上下文和 Git 状态三块。
class WorkbenchInspector extends StatelessWidget {
  const WorkbenchInspector({super.key});

  @override
  Widget build(BuildContext context) {
    const git = DemoData.gitStatus;

    return Container(
      width: AppLayout.inspectorWidth,
      decoration: const BoxDecoration(
        color: AppColors.sidebarBg,
        border: Border(left: BorderSide(color: AppColors.line)),
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _Section(
              heading: '本次任务',
              trailing: const _RunningPill('执行中'),
              child: Column(
                children: [
                  for (final run in DemoData.taskRuns) _TaskRunCard(run),
                ],
              ),
            ),
            _Section(
              heading: '上下文',
              trailing: const _TextAction('管理'),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  for (final ref in DemoData.contextFiles) _ContextRow(ref),
                ],
              ),
            ),
            _Section(
              heading: 'Git 状态',
              trailing: Text(
                '${git.changedFiles} 个变更',
                style: const TextStyle(fontSize: 10, color: AppColors.danger),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        '+${git.totalAdded} 新增',
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.plus,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        '-${git.totalRemoved} 删除',
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.minus,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const GhostButton(label: '查看变更', expand: true),
                ],
              ),
            ),
            const _Section(
              heading: null,
              child: NoticeBox(DemoData.inspectorNotice),
            ),
          ],
        ),
      ),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({required this.child, this.heading, this.trailing});

  final Widget child;
  final String? heading;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 17),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: AppColors.line)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (heading != null) ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  heading!,
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.3,
                    color: Color(0xFF647083),
                  ),
                ),
                if (trailing != null) trailing!,
              ],
            ),
            const SizedBox(height: 11),
          ],
          child,
        ],
      ),
    );
  }
}

class _RunningPill extends StatelessWidget {
  const _RunningPill(this.label);

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
      decoration: BoxDecoration(
        color: AppColors.teal50,
        borderRadius: BorderRadius.circular(AppRadius.pill),
      ),
      child: Text(
        label,
        style: const TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: AppColors.teal,
        ),
      ),
    );
  }
}

class _TextAction extends StatelessWidget {
  const _TextAction(this.label);

  final String label;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      cursor: SystemMouseCursors.click,
      child: Text(
        label,
        style: const TextStyle(fontSize: 12, color: AppColors.muted),
      ),
    );
  }
}

class _TaskRunCard extends StatelessWidget {
  const _TaskRunCard(this.run);

  final TaskRun run;

  @override
  Widget build(BuildContext context) {
    final running = run.status == TaskRunStatus.running;
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      child: SurfaceCard(
        padding: const EdgeInsets.all(10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                _AgentSymbol(run.symbol, running: running),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        run.title,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppColors.text,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '任务：${run.id}',
                        style: const TextStyle(
                          fontSize: 10,
                          color: AppColors.muted,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                if (running)
                  Chip8.amber(run.status.label)
                else
                  Chip8.green(run.status.label),
                const SizedBox(width: 6),
                Flexible(child: Chip8(run.outputPath ?? run.model)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _AgentSymbol extends StatelessWidget {
  const _AgentSymbol(this.symbol, {required this.running});

  final String symbol;
  final bool running;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 26,
      width: 26,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: running ? AppColors.amber50 : AppColors.violet50,
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
      child: Text(
        symbol,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w700,
          color: running ? AppColors.amber : AppColors.violet,
        ),
      ),
    );
  }
}

class _ContextRow extends StatelessWidget {
  const _ContextRow(this.ref);

  final ContextFileRef ref;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 7),
      child: Row(
        children: [
          FileTypeBadge(ref.kind.label),
          const SizedBox(width: 7),
          Text(
            ref.label,
            style: const TextStyle(fontSize: 11, color: Color(0xFF596577)),
          ),
        ],
      ),
    );
  }
}
