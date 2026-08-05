/// 工作区内的实体模型。
///
/// 这些模型对应 PRD「文件协议层」中的文件形态：
/// `models/*.yaml`、`agents/*.md`、`tasks/*.yaml`、`knowledge/**`、`materials/*`。
/// 当前阶段为 UI 层内存模型，后续由文件解析层填充。
library;

import 'package:flutter/foundation.dart';

/// 主导航区域。对应原型侧边栏的 6 个入口。
enum WorkbenchView {
  chat('大副对话'),
  knowledge('知识工作区'),
  library('用户素材库'),
  agents('Agent 配置'),
  models('模型连接'),
  git('Git 变更');

  const WorkbenchView(this.label);

  final String label;
}

/// 桌面平台外观。仅影响窗口装饰，不影响工作区文件格式。
enum DesktopPlatformStyle { macOS, windows }

/// 消息作者。
enum MessageAuthor { user, firstMate }

/// 船员任务状态，对应 PRD P5 任务看板的状态枚举。
enum TaskRunStatus {
  queued('排队中'),
  running('执行中'),
  waitingInput('等待输入'),
  done('已完成'),
  failed('失败');

  const TaskRunStatus(this.label);

  final String label;

  bool get isTerminal => this == done || this == failed;
}

/// 文件类型标签，用于列表和卡片上的角标。
enum WorkspaceFileKind {
  markdown('MD'),
  yaml('YAML'),
  json('JSON'),
  pdf('PDF'),
  text('TXT'),
  image('IMG');

  const WorkspaceFileKind(this.label);

  final String label;
}

/// 一条对话消息。
@immutable
class ChatMessage {
  const ChatMessage({
    required this.id,
    required this.author,
    required this.text,
    this.boldLead,
    this.taskGroup,
    this.citation,
  });

  final String id;
  final MessageAuthor author;
  final String text;

  /// 气泡首行加粗内容，对应原型里的 `<strong>已完成第一轮梳理。</strong>`
  final String? boldLead;

  /// 内嵌的任务卡片。
  final TaskGroup? taskGroup;

  /// 引用来源，如 `knowledge/decisions/file-first-architecture.md`
  final String? citation;

  bool get isUser => author == MessageAuthor.user;
}

/// 一次任务派发中的并行步骤集合。
@immutable
class TaskGroup {
  const TaskGroup({
    required this.title,
    required this.note,
    required this.steps,
  });

  final String title;
  final String note;
  final List<TaskStep> steps;
}

/// 单个船员执行步骤。
@immutable
class TaskStep {
  const TaskStep({
    required this.label,
    required this.model,
    required this.status,
  });

  final String label;
  final String model;
  final TaskRunStatus status;
}

/// 任务看板中的运行条目，对应 `tasks/*.yaml`。
@immutable
class TaskRun {
  const TaskRun({
    required this.id,
    required this.symbol,
    required this.title,
    required this.status,
    required this.model,
    this.outputPath,
  });

  final String id;
  final String symbol;
  final String title;
  final TaskRunStatus status;
  final String model;
  final String? outputPath;
}

/// 最近会话条目。
@immutable
class SessionSummary {
  const SessionSummary({
    required this.title,
    required this.subtitle,
  });

  final String title;
  final String subtitle;
}

/// 知识工作区的文件树节点。
@immutable
class TreeNode {
  const TreeNode({
    required this.name,
    this.isFolder = false,
    this.depth = 0,
    this.children = const [],
  });

  final String name;
  final bool isFolder;
  final int depth;
  final List<TreeNode> children;
}

/// 一篇知识文档，对应 `knowledge/**/*.md`。
@immutable
class KnowledgeDoc {
  const KnowledgeDoc({
    required this.path,
    required this.title,
    required this.meta,
    required this.callout,
    required this.principles,
    required this.relatedFiles,
  });

  final String path;
  final String title;
  final String meta;
  final String callout;
  final List<String> principles;
  final List<String> relatedFiles;

  /// `knowledge / decisions / file-first-architecture.md` 形式的面包屑
  String get breadcrumb => path.split('/').join(' / ');
}

/// 素材库条目，对应 `materials/*`。
@immutable
class MaterialItem {
  const MaterialItem({
    required this.kind,
    required this.size,
    required this.title,
    required this.description,
    required this.tags,
  });

  final WorkspaceFileKind kind;
  final String size;
  final String title;
  final String description;
  final List<MaterialTag> tags;
}

/// 素材卡片上的标签。
@immutable
class MaterialTag {
  const MaterialTag(this.label, {this.highlighted = false});

  final String label;
  final bool highlighted;
}

/// 船员/大副定义，对应 `agents/*.md`。
@immutable
class AgentDefinition {
  const AgentDefinition({
    required this.name,
    required this.description,
    required this.defaultModel,
    required this.writeScope,
    required this.enabled,
    this.snippet,
  });

  final String name;
  final String description;
  final String defaultModel;
  final String writeScope;
  final bool enabled;

  /// 定义文件片段预览。
  final String? snippet;
}

/// 模型定义，对应 `models/*.yaml`。密钥永不落到这里。
@immutable
class ModelConnection {
  const ModelConnection({
    required this.id,
    required this.filePath,
    required this.protocol,
    required this.capabilities,
    required this.credential,
    required this.connected,
  });

  final String id;
  final String filePath;
  final String protocol;
  final String capabilities;

  /// 仅保存钥匙串引用，绝不是明文密钥。
  final String credential;
  final bool connected;

  String get statusLabel => connected ? '可用' : '未连接';
}

/// Git 变更条目。
@immutable
class DiffEntry {
  const DiffEntry({
    required this.kind,
    required this.path,
    required this.added,
    required this.removed,
  });

  final WorkspaceFileKind kind;
  final String path;
  final int added;
  final int removed;
}

/// Git 工作区整体状态。
@immutable
class GitWorkspaceStatus {
  const GitWorkspaceStatus({
    required this.branch,
    required this.lastCommitAt,
    required this.diffs,
    required this.commitMessage,
  });

  final String branch;
  final String lastCommitAt;
  final List<DiffEntry> diffs;
  final String commitMessage;

  int get changedFiles => diffs.length;

  int get totalAdded => diffs.fold(0, (sum, d) => sum + d.added);

  int get totalRemoved => diffs.fold(0, (sum, d) => sum + d.removed);
}

/// 检查器中的上下文文件引用。
@immutable
class ContextFileRef {
  const ContextFileRef(this.kind, this.label);

  final WorkspaceFileKind kind;
  final String label;
}
