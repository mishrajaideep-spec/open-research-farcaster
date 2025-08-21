from typing import Annotated, Sequence, TypedDict
from dotenv import load_dotenv
from langchain_core.messages import BaseMessage, SystemMessage
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode
import os
import requests

load_dotenv()


class AgentState(TypedDict):
    """State holding the conversation messages."""
    messages: Annotated[Sequence[BaseMessage], add_messages]


class NeynarClient:
    """Lightweight client for Neynar's Farcaster API."""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.neynar.com/v2"
        self.headers = {
            "x-api-key": api_key,
            "Content-Type": "application/json",
        }

    def fetch_bulk_users(self, fids, viewer_fid=None):
        url = f"{self.base_url}/farcaster/user/bulk"
        params = {"fids": ",".join(map(str, fids))}
        if viewer_fid:
            params["viewer_fid"] = viewer_fid
        response = requests.get(url, headers=self.headers, params=params)
        response.raise_for_status()
        return response.json()

    def fetch_feed(self, feed_type, fid=None, limit=25, cursor=None):
        url = f"{self.base_url}/farcaster/feed"
        params = {"feed_type": feed_type, "limit": limit}
        if fid:
            params["fid"] = fid
        if cursor:
            params["cursor"] = cursor
        response = requests.get(url, headers=self.headers, params=params)
        response.raise_for_status()
        return response.json()

    def fetch_cast_by_hash(self, cast_hash, viewer_fid=None):
        url = f"{self.base_url}/farcaster/cast"
        params = {"identifier": cast_hash, "type": "hash"}
        if viewer_fid:
            params["viewer_fid"] = viewer_fid
        response = requests.get(url, headers=self.headers, params=params)
        response.raise_for_status()
        return response.json()

    def create_signer(self, developer_fid=None):
        url = f"{self.base_url}/farcaster/signer"
        payload = {}
        if developer_fid:
            payload["developer_fid"] = developer_fid
        response = requests.post(url, headers=self.headers, json=payload or None)
        response.raise_for_status()
        return response.json()

    def check_signer_status(self, signer_uuid):
        url = f"{self.base_url}/farcaster/signer"
        params = {"signer_uuid": signer_uuid}
        response = requests.get(url, headers=self.headers, params=params)
        response.raise_for_status()
        return response.json()

    def post_cast(self, signer_uuid, text, parent=None, embeds=None, channel_id=None):
        url = f"{self.base_url}/farcaster/cast/"
        payload = {"signer_uuid": signer_uuid, "text": text}
        if parent:
            payload["parent"] = parent
        if embeds:
            payload["embeds"] = embeds
        if channel_id:
            payload["channel_id"] = channel_id
        response = requests.post(url, headers=self.headers, json=payload)
        response.raise_for_status()
        return response.json()


client = NeynarClient(os.getenv("NEYNAR_API_KEY", ""))


@tool
def fetch_user_profile(fids: str):
    """Fetch user profiles by FIDs (comma-separated list)."""
    try:
        fids_list = [int(fid.strip()) for fid in fids.split(",")]
        return client.fetch_bulk_users(fids_list)
    except Exception as e:  # pragma: no cover - network errors
        return f"Error fetching user profiles: {e}"


@tool
def fetch_user_feed(fid: int, feed_type: str = "following", limit: int = 25):
    """Fetch a user's feed."""
    try:
        return client.fetch_feed(feed_type=feed_type, fid=fid, limit=limit)
    except Exception as e:  # pragma: no cover
        return f"Error fetching user feed: {e}"


@tool
def fetch_cast_details(cast_hash: str, viewer_fid: int | None = None):
    """Fetch cast details by hash."""
    try:
        return client.fetch_cast_by_hash(cast_hash, viewer_fid)
    except Exception as e:  # pragma: no cover
        return f"Error fetching cast details: {e}"


@tool
def create_farcaster_signer():
    """Create a new signer for posting to Farcaster."""
    try:
        result = client.create_signer()
        signer_uuid = result.get("signer_uuid")
        approval_url = (
            f"https://client.warpcast.com/deeplinks/signed-key-request?token={signer_uuid}"
        )
        return (
            "I've created a signer for you with the UUID "
            f"`{signer_uuid}`. To proceed with posting your cast, please visit: {approval_url}"
        )
    except Exception as e:  # pragma: no cover
        return f"Error creating signer: {e}"


@tool
def check_signer_authorization(signer_uuid: str):
    """Check if a signer is authorized."""
    try:
        result = client.check_signer_status(signer_uuid)
        status = result.get("status", "unknown")
        if status == "approved":
            return f"Signer {signer_uuid} is authorized and ready to post casts!"
        if status == "pending_approval":
            approval_url = result.get("signer_approval_url")
            return f"Signer {signer_uuid} is pending approval. Visit: {approval_url}"
        return f"Signer {signer_uuid} status: {status}. Full details: {result}"
    except Exception as e:  # pragma: no cover
        return f"Error checking signer status: {e}"


@tool
def post_cast_to_farcaster(signer_uuid: str, text: str, channel_id: str | None = None):
    """Post a cast to Farcaster."""
    try:
        signer_status = client.check_signer_status(signer_uuid)
        if signer_status.get("status") != "approved":
            approval_url = signer_status.get("signer_approval_url")
            return (
                "Cannot post cast - signer is not authorized. Please authorize at: "
                f"{approval_url}"
            )
        result = client.post_cast(signer_uuid, text, channel_id=channel_id)
        cast_hash = result.get("cast", {}).get("hash")
        if cast_hash:
            return f"Cast posted successfully! Cast hash: {cast_hash}."
        return f"Cast posted successfully! Response: {result}"
    except Exception as e:  # pragma: no cover
        return f"Error posting cast: {e}"


tools = [
    fetch_user_profile,
    fetch_user_feed,
    fetch_cast_details,
    create_farcaster_signer,
    check_signer_authorization,
    post_cast_to_farcaster,
]

model = ChatOpenAI(model="gpt-4o").bind_tools(tools)


def model_call(state: AgentState) -> AgentState:
    system_prompt = SystemMessage(
        content="You are my AI assistant, please answer my query to the best of your ability."
    )
    response = model.invoke([system_prompt] + state["messages"])
    return {"messages": [response]}


def should_continue(state: AgentState):
    last_message = state["messages"][-1]
    return "end" if not last_message.tool_calls else "continue"


graph_builder = StateGraph(AgentState)

graph_builder.add_node("assistant", model_call)

graph_builder.add_node("tools", ToolNode(tools=tools))

graph_builder.set_entry_point("assistant")

graph_builder.add_conditional_edges(
    "assistant", should_continue, {"continue": "tools", "end": END}
)


graph_builder.add_edge("tools", "assistant")

graph = graph_builder.compile()

