package com.secdec.codepulse.data.trace

import com.fasterxml.jackson.core.{ JsonFactory, JsonGenerator }

import com.secdec.codepulse.data.bytecode.CodeTreeNodeKind

case class TreeNode(data: TreeNodeData, children: List[TreeNode])

case class PackageTreeNode(id: Option[Int], kind: CodeTreeNodeKind, label: String, methodCount: Int, traced: Option[Boolean], children: List[PackageTreeNode])

/** Builds/projects treemap and package tree data as JSON for client.
  * TODO: manage lifetime of cached data internally
  *
  * @author robertf
  */
class TreeBuilder(treeNodeData: TreeNodeDataAccess) {
	/** Full set of tree roots and nodes */
	lazy val (roots, nodes) = {
		val roots = List.newBuilder[Int]
		val nodes = Map.newBuilder[Int, TreeNodeData]
		val children = collection.mutable.HashMap.empty[Int, collection.mutable.Builder[Int, List[Int]]]

		def childrenFor(id: Int) = children.getOrElseUpdate(id, List.newBuilder[Int])

		treeNodeData foreach { data =>
			nodes += data.id -> data
			(data.parentId match {
				case Some(parent) => childrenFor(parent)
				case None => roots
			}) += data.id
		}

		val nodeMap = nodes.result

		def buildNode(id: Int): TreeNode = {
			val children = childrenFor(id).result.map(buildNode)
			TreeNode(nodeMap(id), children)
		}

		(roots.result.map(buildNode), nodeMap)
	}

	/** Full package tree, with self nodes */
	lazy val packageTree = {
		// build up a package tree with the relevant data

		/** A node is eligible for a self node if it is a package node that has at least one
		  * package child and one non-package child (class/method).
		  */
		def isEligibleForSelfNode(node: TreeNode) = {
			node.data.kind == CodeTreeNodeKind.Pkg &&
				node.children.exists {
					case TreeNode(data, _) if data.kind == CodeTreeNodeKind.Pkg => true
					case _ => false
				} &&
				node.children.exists {
					case TreeNode(data, _) if data.kind == CodeTreeNodeKind.Cls || data.kind == CodeTreeNodeKind.Mth => true
					case _ => false
				}
		}

		def countMethods(node: TreeNode): Int = {
			(node.children map {
				case TreeNode(data, _) if data.kind == CodeTreeNodeKind.Mth => 1
				case node => countMethods(node)
			}).sum
		}

		def transform(node: TreeNode): PackageTreeNode = {
			// we only want groups and packages
			def filterChildren(children: List[TreeNode]) = children.filter { n => n.data.kind == CodeTreeNodeKind.Grp || n.data.kind == CodeTreeNodeKind.Pkg }

			if (isEligibleForSelfNode(node)) {
				// split the node children depending on where they belong
				val (selfChildren, children) = node.children.partition {
					case TreeNode(data, _) if data.kind == CodeTreeNodeKind.Cls || data.kind == CodeTreeNodeKind.Mth => true
					case _ => false
				}

				// build the self node
				val selfNode = PackageTreeNode(Some(node.data.id), CodeTreeNodeKind.Pkg, "<self>", selfChildren.map(countMethods).sum, node.data.traced, Nil)
				PackageTreeNode(None, node.data.kind, node.data.label, countMethods(node), node.data.traced, selfNode :: filterChildren(children).map(transform))
			} else {
				PackageTreeNode(Some(node.data.id), node.data.kind, node.data.label, countMethods(node), node.data.traced, filterChildren(node.children).map(transform))
			}
		}

		roots.map(transform)
	}

	/** Projects a tree containing the selected packages and their immediate children */
	def projectTree(selectedNodes: Set[Int]) = {
		val incidentalNodes = collection.mutable.HashSet.empty[Int]

		// recursively mark all parents of `selectedNodes` as incidental nodes (partially accepted)
		def markIncidentalPath(node: Int) {
			incidentalNodes += node

			for {
				node <- nodes get node
				parent <- node.parentId
			} markIncidentalPath(parent)
		}

		selectedNodes.foreach(markIncidentalPath)

		// build the projected tree
		def filterNode(node: TreeNode): Option[TreeNode] = {
			def isSubstantialChild(node: TreeNode) = node.data.kind != CodeTreeNodeKind.Grp && node.data.kind != CodeTreeNodeKind.Pkg

			// only include this node if it is incidental
			if (incidentalNodes contains node.data.id) {
				val isSelected = selectedNodes contains node.data.id

				// filter children; don't include substantial data if only incidental
				// the only exception to this is if that child was requested specifically
				val filteredChildren = node.children.flatMap {
					case child if isSubstantialChild(child) =>
						if (isSelected) Some(child)
						else filterNode(child)

					case child => filterNode(child)
				}

				if (isSelected || !filteredChildren.isEmpty)
					Some(TreeNode(node.data, filteredChildren))
				else
					None
			} else None
		}

		roots.flatMap(filterNode)
	}
}