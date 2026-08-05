import 'package:flutter/material.dart';

import '../data/demo_data.dart';
import '../design/tokens.dart';
import '../models/workspace_models.dart';
import '../shell/view_scaffold.dart';
import '../widgets/common.dart';

/// P6 Agent 配置页。对应原型 `#view-agents`。
class AgentsView extends StatelessWidget {
  const AgentsView({super.key});

  @override
  Widget build(BuildContext context) {
    return ViewScaffold(
      header: const ViewHeader(
        title: 'Agent 配置',
        subtitle: DemoData.agentsSubtitle,
        actions: [
          GhostButton(label: '校验定义'),
          PrimaryButton(label: '新建船员'),
        ],
      ),
      body: LayoutBuilder(
        builder: (context, constraints) {
          final columns =
              constraints.maxWidth < AppLayout.gridBreakpoint ? 1 : 2;
          const gap = 12.0;
          return SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            child: LayoutBuilder(
              builder: (context, inner) {
                final itemWidth =
                    (inner.maxWidth - gap * (columns - 1)) / columns;
                return Wrap(
                  spacing: gap,
                  runSpacing: gap,
                  children: [
                    for (final agent in DemoData.agents)
                      SizedBox(width: itemWidth, child: _AgentCard(agent)),
                  ],
                );
              },
            ),
          );
        },
      ),
    );
  }
}

class _AgentCard extends StatelessWidget {
  const _AgentCard(this.agent);

  final AgentDefinition agent;

  @override
  Widget build(BuildContext context) {
    return SurfaceCard(
      borderRadius: 10,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(agent.name, style: AppText.cardTitle),
          const SizedBox(height: 5),
          Text(
            agent.description,
            style: const TextStyle(
              fontSize: 11,
              height: 1.55,
              color: AppColors.muted,
            ),
          ),
          const SizedBox(height: 13),
          _KeyRow(
            label: '默认模型',
            value: Chip8.violet(agent.defaultModel),
            first: true,
          ),
          _KeyRow(
            label: '写入范围',
            value: Flexible(
              child: Text(
                agent.writeScope,
                textAlign: TextAlign.right,
                style: const TextStyle(fontSize: 11, color: Color(0xFF3E4958)),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ),
          _KeyRow(
            label: '状态',
            value: StatusPill(
              label: agent.enabled ? '启用' : '停用',
              ok: agent.enabled,
            ),
          ),
          if (agent.snippet != null) ...[
            const SizedBox(height: 12),
            CodeBlock(agent.snippet!),
          ],
        ],
      ),
    );
  }
}

/// 键值行。对应 `.key-row`，第一行不画上边框。
class _KeyRow extends StatelessWidget {
  const _KeyRow({
    required this.label,
    required this.value,
    this.first = false,
  });

  final String label;
  final Widget value;
  final bool first;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(
        border: first
            ? null
            : const Border(top: BorderSide(color: AppColors.lineSoft)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(fontSize: 11, color: Color(0xFF3E4958)),
          ),
          const SizedBox(width: 12),
          value,
        ],
      ),
    );
  }
}
