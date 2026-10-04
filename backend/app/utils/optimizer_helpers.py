from collections import defaultdict
from collections.abc import Mapping, Sequence
from datetime import datetime
from typing import Any


def _get_value(item: Any, key: str, default: Any = None) -> Any:
    if isinstance(item, Mapping):
        return item.get(key, default)
    return getattr(item, key, default)


def build_service_dag(assignments: Sequence[Any]) -> dict[str, list[Any]]:
    """Build a compatibility graph for consecutive route assignments."""
    nodes = [str(_get_value(item, "id", index)) for index, item in enumerate(assignments)]
    edges: list[tuple[str, str]] = []

    for left_index, left in enumerate(assignments):
        left_destination = str(_get_value(left, "destination", "")).casefold()
        left_arrival = _get_value(left, "arrival_time")
        for right_index, right in enumerate(assignments):
            if right_index <= left_index:
                continue
            right_origin = str(_get_value(right, "origin", "")).casefold()
            right_departure = _get_value(right, "departure_time")
            time_compatible = (
                not isinstance(left_arrival, datetime)
                or not isinstance(right_departure, datetime)
                or right_departure >= left_arrival
            )
            if left_destination and left_destination == right_origin and time_compatible:
                edges.append((nodes[left_index], nodes[right_index]))

    # TODO(phase-2): include locomotive, track, maintenance, and time-window constraints.
    return {"nodes": nodes, "edges": edges}


def solve_minimum_path_cover(service_dag: Mapping[str, Sequence[Any]]) -> list[list[str]]:
    """Return a deterministic greedy path cover for the supplied DAG."""
    nodes = [str(node) for node in service_dag.get("nodes", [])]
    edges = [(str(edge[0]), str(edge[1])) for edge in service_dag.get("edges", [])]
    successors: dict[str, list[str]] = defaultdict(list)
    predecessors: set[str] = set()

    for source, target in edges:
        if source in nodes and target in nodes and target not in successors[source]:
            successors[source].append(target)
            predecessors.add(target)

    paths: list[list[str]] = []
    visited: set[str] = set()
    starts = [node for node in nodes if node not in predecessors]
    starts.extend(node for node in nodes if node in predecessors)

    for start in starts:
        if start in visited:
            continue
        path = [start]
        visited.add(start)
        current = start
        while True:
            next_node = next((node for node in successors[current] if node not in visited), None)
            if next_node is None:
                break
            path.append(next_node)
            visited.add(next_node)
            current = next_node
        paths.append(path)

    # TODO(phase-2): replace greedy chaining with bipartite maximum matching for an exact cover.
    return paths


def calculate_kpis(
    assignments: Sequence[Any],
    plan_id: int | None = None,
    wagon_capacities: Mapping[int, float] | None = None,
) -> dict[str, Any]:
    used_capacity: dict[int, float] = defaultdict(float)
    order_ids: set[int] = set()
    wagon_ids: set[int] = set()
    total_quantity = 0.0
    total_cost = 0.0

    for assignment in assignments:
        order_id = _get_value(assignment, "order_id")
        wagon_id = _get_value(assignment, "wagon_id")
        quantity = float(_get_value(assignment, "quantity_tons", 0) or 0)
        order_ids.add(order_id)
        wagon_ids.add(wagon_id)
        used_capacity[wagon_id] += quantity
        total_quantity += quantity
        total_cost += float(_get_value(assignment, "estimated_cost", 0) or 0)

    capacities = wagon_capacities or {}
    utilizations = [
        min(100.0, quantity / float(capacities[wagon_id]) * 100)
        for wagon_id, quantity in used_capacity.items()
        if capacities.get(wagon_id, 0) > 0
    ]

    return {
        "plan_id": plan_id,
        "total_orders": len(order_ids),
        "total_assignments": len(assignments),
        "wagons_used": len(wagon_ids),
        "total_quantity_tons": total_quantity,
        "total_estimated_cost": total_cost,
        "average_wagon_utilization_percent": sum(utilizations) / len(utilizations) if utilizations else 0.0,
    }


def validate_assignments(
    assignments: Sequence[Any],
    orders: Sequence[Any] | None = None,
    wagons: Sequence[Any] | None = None,
    plants: Sequence[Any] | None = None,
) -> list[str]:
    """Return validation errors for references, quantities, capacities, and times."""
    errors: list[str] = []
    order_ids = {_get_value(item, "order_id", _get_value(item, "id")) for item in orders or []}
    wagon_ids = {_get_value(item, "id", _get_value(item, "wagon_id")) for item in wagons or []}
    plant_ids = {_get_value(item, "id", _get_value(item, "plant_id")) for item in plants or []}
    wagon_by_id = {
        _get_value(item, "id", _get_value(item, "wagon_id")): item
        for item in wagons or []
    }
    seen_order_wagons: set[tuple[Any, Any]] = set()

    for index, assignment in enumerate(assignments):
        order_id = _get_value(assignment, "order_id")
        wagon_id = _get_value(assignment, "wagon_id")
        plant_id = _get_value(assignment, "plant_id")
        quantity = float(_get_value(assignment, "quantity_tons", 0) or 0)
        departure = _get_value(assignment, "departure_time")
        arrival = _get_value(assignment, "arrival_time")

        if orders is not None and order_id not in order_ids:
            errors.append(f"Assignment {index} references unknown order {order_id}.")
        if wagons is not None and wagon_id not in wagon_ids:
            errors.append(f"Assignment {index} references unknown wagon {wagon_id}.")
        if plants is not None and plant_id not in plant_ids:
            errors.append(f"Assignment {index} references unknown plant {plant_id}.")
        if quantity <= 0:
            errors.append(f"Assignment {index} quantity must be greater than zero.")

        wagon = wagon_by_id.get(wagon_id)
        capacity = _get_value(wagon, "max_capacity_tons") if wagon is not None else None
        if capacity is not None and quantity > float(capacity):
            errors.append(f"Assignment {index} exceeds wagon {wagon_id} capacity.")

        if isinstance(departure, datetime) and isinstance(arrival, datetime) and arrival <= departure:
            errors.append(f"Assignment {index} arrival must be after departure.")

        key = (order_id, wagon_id)
        if key in seen_order_wagons:
            errors.append(f"Assignment {index} duplicates order {order_id} on wagon {wagon_id}.")
        seen_order_wagons.add(key)

    # TODO(phase-2): validate overlapping wagon schedules and plant loading windows.
    return errors
