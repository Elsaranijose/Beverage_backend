const usersRepo = require("../repositories/users.repository");

async function listMembers(_req, res) {
  try {
    return res.json(await usersRepo.findMembers());
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to load members" });
  }
}

async function updateMemberStatus(req, res) {
  try {
    const status = req.body?.status;
    const result = await usersRepo.setStatus(req.params.id, status);
    if (!result.ok) return res.status(400).json(result);
    return res.json(result.user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to update member" });
  }
}

async function deleteMember(req, res) {
  try {
    const result = await usersRepo.remove(req.params.id);
    if (!result.ok) return res.status(400).json(result);
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to delete member" });
  }
}

module.exports = { listMembers, updateMemberStatus, deleteMember };
