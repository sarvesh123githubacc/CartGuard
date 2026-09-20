import cedarpy


def test_cedar_smoke_permit():
    """Verify that a matching Cedar permit policy evaluates to Allow."""
    policy = """
    permit(
        principal == User::"shopper",
        action == Action::"add_to_cart",
        resource == Product::"laptop"
    );
    """
    request = {
        "principal": {"type": "User", "id": "shopper"},
        "action": {"type": "Action", "id": "add_to_cart"},
        "resource": {"type": "Product", "id": "laptop"},
        "context": {},
    }
    result = cedarpy.is_authorized(request, policy, [])
    assert result.allowed is True
    assert result.decision == cedarpy.Decision.Allow


def test_cedar_smoke_deny_unauthorized():
    """Verify that an unauthorized request evaluates to Deny (default deny)."""
    policy = """
    permit(
        principal == User::"shopper",
        action == Action::"add_to_cart",
        resource == Product::"laptop"
    );
    """
    request = {
        "principal": {"type": "User", "id": "attacker"},
        "action": {"type": "Action", "id": "transfer_funds"},
        "resource": {"type": "Account", "id": "victim"},
        "context": {},
    }
    result = cedarpy.is_authorized(request, policy, [])
    assert result.allowed is False
    assert result.decision == cedarpy.Decision.Deny


if __name__ == "__main__":
    test_cedar_smoke_permit()
    test_cedar_smoke_deny_unauthorized()
    print("ALL CEDAR SMOKE TESTS PASSED!")
