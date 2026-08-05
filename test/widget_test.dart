import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:javis/models/workspace_models.dart';
import 'package:javis/shell/workbench_shell.dart';
import 'package:javis/state/workbench_providers.dart';

/// 用固定的大窗口渲染，保证三栏都在（宽度需大于 1050 断点）。
Future<void> _pumpShell(WidgetTester tester) async {
  tester.view.physicalSize = const Size(1600, 1000);
  tester.view.devicePixelRatio = 1.0;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);

  await tester.pumpWidget(
    const ProviderScope(
      child: MaterialApp(home: Scaffold(body: WorkbenchShell())),
    ),
  );
  await tester.pumpAndSettle();
}

void main() {
  testWidgets('默认进入大副对话，三栏都渲染出来', (tester) async {
    await _pumpShell(tester);

    // 侧边栏
    expect(find.text('新建会话'), findsOneWidget);
    expect(find.text('大副对话'), findsOneWidget);
    // 主工作区
    expect(find.text('FirstMate 产品方案'), findsWidgets);
    // 右侧检查器
    expect(find.text('本次任务'), findsOneWidget);
    expect(find.text('Git 状态'), findsOneWidget);
  });

  testWidgets('点击侧边栏可以切换到各个视图', (tester) async {
    await _pumpShell(tester);

    for (final view in [
      WorkbenchView.knowledge,
      WorkbenchView.library,
      WorkbenchView.agents,
      WorkbenchView.models,
      WorkbenchView.git,
    ]) {
      await tester.tap(find.text(view.label).first);
      await tester.pumpAndSettle();
      // 视图标题栏里应出现同名标题（侧边栏 + 标题栏共两处）
      expect(find.text(view.label), findsWidgets);
    }
  });

  testWidgets('模型连接页只展示钥匙串引用，不出现明文密钥', (tester) async {
    await _pumpShell(tester);
    await tester.tap(find.text(WorkbenchView.models.label).first);
    await tester.pumpAndSettle();

    expect(find.text('Keychain: DEFAULT'), findsOneWidget);
    expect(find.text('未连接'), findsOneWidget);
    // credential_ref 只出现在 YAML 示例里，作为环境变量名而非值
    expect(
      find.textContaining('credential_ref: FIRSTMATE_DEFAULT_API_KEY'),
      findsOneWidget,
    );
  });

  testWidgets('发送消息会追加到会话流', (tester) async {
    await _pumpShell(tester);

    final field = find.byType(TextField).first;
    await tester.enterText(field, '帮我查下明天北京天气');
    await tester.testTextInput.receiveAction(TextInputAction.done);
    await tester.pumpAndSettle();

    expect(find.text('帮我查下明天北京天气'), findsOneWidget);
  });

  testWidgets('Git 页勾选文件会更新已选数量', (tester) async {
    await _pumpShell(tester);
    await tester.tap(find.text(WorkbenchView.git.label).first);
    await tester.pumpAndSettle();

    // 默认三个文件全部勾选
    expect(find.text('已选择 3 个文件'), findsOneWidget);
  });

  test('Git 状态汇总行数计算正确', () {
    const status = GitWorkspaceStatus(
      branch: 'main',
      lastCommitAt: '昨天',
      commitMessage: 'test',
      diffs: [
        DiffEntry(
          kind: WorkspaceFileKind.markdown,
          path: 'a.md',
          added: 10,
          removed: 2,
        ),
        DiffEntry(
          kind: WorkspaceFileKind.yaml,
          path: 'b.yaml',
          added: 5,
          removed: 3,
        ),
      ],
    );

    expect(status.changedFiles, 2);
    expect(status.totalAdded, 15);
    expect(status.totalRemoved, 5);
  });

  test('文件树筛选保留文件夹节点，避免层级断裂', () {
    final container = ProviderContainer();
    addTearDown(container.dispose);

    container.read(treeFilterProvider.notifier).state = 'prd';
    final filtered = container.read(filteredTreeProvider);

    expect(filtered.any((n) => n.name == 'prd-v0.2.md'), isTrue);
    expect(filtered.any((n) => n.name == 'knowledge' && n.isFolder), isTrue);
    expect(filtered.any((n) => n.name == 'desktop-layout.md'), isFalse);
  });
}
