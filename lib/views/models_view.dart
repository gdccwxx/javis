import 'package:flutter/material.dart';

import '../data/demo_data.dart';
import '../design/tokens.dart';
import '../models/workspace_models.dart';
import '../shell/view_scaffold.dart';
import '../widgets/common.dart';

/// P7 模型连接页。对应原型 `#view-models`。
///
/// 这一页最重要的约束来自 PRD：密钥永远不落到 YAML 或 Git，
/// 表格里只展示钥匙串引用。UI 上用 NoticeBox 把这条规则显式讲出来。
class ModelsView extends StatelessWidget {
  const ModelsView({super.key});

  @override
  Widget build(BuildContext context) {
    return const ViewScaffold(
      header: ViewHeader(
        title: '模型连接',
        subtitle: DemoData.modelsSubtitle,
        actions: [PrimaryButton(label: '新增模型')],
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.symmetric(horizontal: 24, vertical: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            NoticeBox(DemoData.modelsNotice),
            SizedBox(height: 20),
            _ModelTable(),
            SizedBox(height: 20),
            CodeBlock(DemoData.modelYamlSample),
          ],
        ),
      ),
    );
  }
}

class _ModelTable extends StatelessWidget {
  const _ModelTable();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const _TableHeader(),
        for (final model in DemoData.models) _ModelRow(model),
      ],
    );
  }
}

/// 表格列宽。用固定 flex 保证表头和内容对齐。
const _colFlex = <int>[30, 20, 16, 18, 10, 10];

class _TableHeader extends StatelessWidget {
  const _TableHeader();

  @override
  Widget build(BuildContext context) {
    const labels = ['模型定义', '协议', '能力', '凭证', '状态', ''];
    return Container(
      padding: const EdgeInsets.only(bottom: 9),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: AppColors.line)),
      ),
      child: Row(
        children: [
          for (var i = 0; i < labels.length; i++)
            Expanded(
              flex: _colFlex[i],
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10),
                child: Text(
                  labels[i],
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.4,
                    color: Color(0xFF8B96A4),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _ModelRow extends StatelessWidget {
  const _ModelRow(this.model);

  final ModelConnection model;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 13),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: Color(0xFFEDF0F3))),
      ),
      child: Row(
        children: [
          _Cell(
            flex: _colFlex[0],
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  model.id,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF273241),
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  model.filePath,
                  style: const TextStyle(fontSize: 10, color: AppColors.muted),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          _Cell(flex: _colFlex[1], child: _text(model.protocol)),
          _Cell(flex: _colFlex[2], child: _text(model.capabilities)),
          _Cell(flex: _colFlex[3], child: _text(model.credential)),
          _Cell(
            flex: _colFlex[4],
            child: Align(
              alignment: Alignment.centerLeft,
              child: StatusPill(
                label: model.statusLabel,
                ok: model.connected,
              ),
            ),
          ),
          _Cell(
            flex: _colFlex[5],
            child: const Align(
              alignment: Alignment.centerLeft,
              child: GhostButton(label: '编辑'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _text(String value) => Text(
        value,
        style: const TextStyle(fontSize: 12, color: Color(0xFF465161)),
        overflow: TextOverflow.ellipsis,
      );
}

class _Cell extends StatelessWidget {
  const _Cell({required this.flex, required this.child});

  final int flex;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      flex: flex,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10),
        child: child,
      ),
    );
  }
}
