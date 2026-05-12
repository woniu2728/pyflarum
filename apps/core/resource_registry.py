from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable, Dict, List, Tuple


ResourceFieldResolver = Callable[[Any, dict], Any]
ResourceBaseFieldResolver = Callable[[Any, dict], dict]
ResourceRelationshipResolver = Callable[[Any, dict], Any]


@dataclass(frozen=True)
class ResourceFieldDefinition:
    resource: str
    field: str
    module_id: str
    resolver: ResourceFieldResolver
    description: str = ""


@dataclass(frozen=True)
class ResourceDefinition:
    resource: str
    module_id: str
    resolver: ResourceBaseFieldResolver
    description: str = ""


@dataclass(frozen=True)
class ResourceRelationshipDefinition:
    resource: str
    relationship: str
    module_id: str
    resolver: ResourceRelationshipResolver
    description: str = ""


class ResourceRegistry:
    def __init__(self):
        self._definitions: Dict[str, ResourceDefinition] = {}
        self._fields: Dict[str, List[ResourceFieldDefinition]] = {}
        self._relationships: Dict[str, List[ResourceRelationshipDefinition]] = {}

    def register_resource(self, definition: ResourceDefinition) -> ResourceDefinition:
        self._definitions[definition.resource] = definition
        return definition

    def register_field(self, definition: ResourceFieldDefinition) -> ResourceFieldDefinition:
        fields = self._fields.setdefault(definition.resource, [])
        existing_index = next(
            (index for index, field in enumerate(fields) if field.field == definition.field),
            None,
        )
        if existing_index is not None:
            fields[existing_index] = definition
        else:
            fields.append(definition)
        fields.sort(key=lambda item: (item.module_id, item.field))
        return definition

    def register_relationship(self, definition: ResourceRelationshipDefinition) -> ResourceRelationshipDefinition:
        relationships = self._relationships.setdefault(definition.resource, [])
        existing_index = next(
            (
                index
                for index, relationship in enumerate(relationships)
                if relationship.relationship == definition.relationship
            ),
            None,
        )
        if existing_index is not None:
            relationships[existing_index] = definition
        else:
            relationships.append(definition)
        relationships.sort(key=lambda item: (item.module_id, item.relationship))
        return definition

    def get_resource(self, resource: str) -> ResourceDefinition | None:
        return self._definitions.get(resource)

    def get_resources(self) -> List[ResourceDefinition]:
        return [
            self._definitions[key]
            for key in sorted(self._definitions.keys())
        ]

    def get_fields(self, resource: str) -> List[ResourceFieldDefinition]:
        return list(self._fields.get(resource, []))

    def get_relationships(self, resource: str) -> List[ResourceRelationshipDefinition]:
        return list(self._relationships.get(resource, []))

    def get_all_fields(self) -> List[ResourceFieldDefinition]:
        definitions: List[ResourceFieldDefinition] = []
        for resource in sorted(set(self._fields.keys()) | set(self._definitions.keys())):
            definitions.extend(self.get_fields(resource))
        return definitions

    def get_all_relationships(self) -> List[ResourceRelationshipDefinition]:
        definitions: List[ResourceRelationshipDefinition] = []
        for resource in sorted(set(self._relationships.keys()) | set(self._definitions.keys())):
            definitions.extend(self.get_relationships(resource))
        return definitions

    def serialize(
        self,
        resource: str,
        instance: Any,
        context: dict | None = None,
        *,
        only: Tuple[str, ...] | List[str] | None = None,
        include: Tuple[str, ...] | List[str] | None = None,
    ) -> dict:
        resolved_context = context or {}
        payload = {}

        resource_definition = self.get_resource(resource)
        if resource_definition:
            payload.update(resource_definition.resolver(instance, resolved_context) or {})

        selected_fields = set(only or [])
        for definition in self.get_fields(resource):
            if selected_fields and definition.field not in selected_fields:
                continue
            payload[definition.field] = definition.resolver(instance, resolved_context)

        include_set = set(include or [])
        if include_set:
            for definition in self.get_relationships(resource):
                if definition.relationship not in include_set:
                    continue
                payload[definition.relationship] = definition.resolver(instance, resolved_context)
        return payload


_resource_registry: ResourceRegistry | None = None


def get_resource_registry() -> ResourceRegistry:
    global _resource_registry
    if _resource_registry is None:
        _resource_registry = ResourceRegistry()
    return _resource_registry
